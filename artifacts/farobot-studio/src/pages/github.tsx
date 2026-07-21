import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  useListGithubRepos, 
  useListRepoContents, 
  useFetchFileContent,
  useUpdateFileContent,
  useListDirContents,
  getListRepoContentsQueryKey,
  GithubRepo,
  GithubFile,
  FileContent
} from "@workspace/api-client-react";
import { 
  Search, GitFork, Lock, Globe, Folder, File, ChevronRight, ChevronDown, 
  Code, Copy, Check, ExternalLink, Zap, Save, Edit3, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Helper components
function FileIcon({ name }: { name: string }) {
  if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) {
    return <Code className="w-4 h-4 text-yellow-400" />;
  }
  if (name.endsWith('.json')) return <File className="w-4 h-4 text-green-400" />;
  if (name.endsWith('.md')) return <File className="w-4 h-4 text-blue-400" />;
  if (name.endsWith('.css')) return <File className="w-4 h-4 text-pink-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
}

export default function GithubPage() {
  const [, setLocation] = useLocation();
  const { data: repos, isLoading: isLoadingRepos } = useListGithubRepos();
  const [search, setSearch] = useState("");

  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  
  // Repo owner and name parser
  const getOwnerRepo = (fullName: string) => {
    const [owner, repo] = fullName.split('/');
    return { owner, repo };
  };

  // Only fetch root if repo is selected
  const activeOwnerRepo = selectedRepo ? getOwnerRepo(selectedRepo.fullName) : null;
  const { data: rootContents, isLoading: isLoadingRoot } = useListRepoContents(
    activeOwnerRepo?.owner || "", 
    activeOwnerRepo?.repo || "",
    { 
      query: { 
        enabled: !!activeOwnerRepo,
        queryKey: getListRepoContentsQueryKey(activeOwnerRepo?.owner || "", activeOwnerRepo?.repo || "")
      } 
    }
  );

  const fetchDir = useListDirContents();
  const fetchFile = useFetchFileContent();
  const updateFile = useUpdateFileContent();

  const [expandedDirs, setExpandedDirs] = useState<Record<string, GithubFile[]>>({});
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set());
  const [activeFile, setActiveFile] = useState<FileContent | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editMessage, setEditMessage] = useState("Update file");

  const toggleDir = (dir: GithubFile) => {
    if (!activeOwnerRepo) return;
    
    const newOpenDirs = new Set(openDirs);
    if (openDirs.has(dir.path)) {
      newOpenDirs.delete(dir.path);
      setOpenDirs(newOpenDirs);
    } else {
      newOpenDirs.add(dir.path);
      setOpenDirs(newOpenDirs);
      
      if (!expandedDirs[dir.path]) {
        fetchDir.mutate({
          data: { owner: activeOwnerRepo.owner, repo: activeOwnerRepo.repo, path: dir.path }
        }, {
          onSuccess: (contents) => {
            setExpandedDirs(prev => ({ ...prev, [dir.path]: contents }));
          }
        });
      }
    }
  };

  const selectFile = (file: GithubFile) => {
    if (!activeOwnerRepo) return;
    setIsLoadingFile(true);
    setActiveFile(null);
    setIsEditing(false);
    
    fetchFile.mutate({
      data: { owner: activeOwnerRepo.owner, repo: activeOwnerRepo.repo, path: file.path }
    }, {
      onSuccess: (content) => {
        setActiveFile(content);
        setEditContent(content.content);
        setIsLoadingFile(false);
      },
      onError: () => {
        setIsLoadingFile(false);
      }
    });
  };

  const handleAskFarobot = () => {
    if (!activeFile) return;
    sessionStorage.setItem("farobot_file_context", JSON.stringify({
      path: activeFile.path,
      content: activeFile.content
    }));
    setLocation("/");
  };

  const handleSave = () => {
    if (!activeFile || !activeOwnerRepo) return;
    
    updateFile.mutate({
      data: {
        owner: activeOwnerRepo.owner,
        repo: activeOwnerRepo.repo,
        path: activeFile.path,
        content: editContent,
        sha: activeFile.sha,
        message: editMessage
      }
    }, {
      onSuccess: (newContent) => {
        setActiveFile(newContent);
        setIsEditing(false);
      }
    });
  };

  const renderTree = (files: GithubFile[], level = 0) => {
    // Sort directories first
    const sorted = [...files].sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'dir' ? -1 : 1;
    });

    return sorted.map((file) => {
      const isOpen = openDirs.has(file.path);
      const isDir = file.type === 'dir';
      const isFileLoading = fetchDir.isPending && fetchDir.variables?.data.path === file.path;

      return (
        <div key={file.sha}>
          <div 
            className={cn(
              "flex items-center gap-1.5 py-1.5 px-2 rounded hover:bg-secondary cursor-pointer text-sm font-medium",
              activeFile?.path === file.path ? "bg-secondary text-primary" : "text-foreground/80"
            )}
            style={{ paddingLeft: `${(level * 12) + 8}px` }}
            onClick={() => isDir ? toggleDir(file) : selectFile(file)}
          >
            {isDir ? (
              <>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" />
              </>
            ) : (
              <>
                <div className="w-3.5" />
                <FileIcon name={file.name} />
              </>
            )}
            <span className="truncate">{file.name}</span>
          </div>
          
          {isDir && isOpen && (
            <div>
              {isFileLoading ? (
                <div style={{ paddingLeft: `${((level + 1) * 12) + 8}px` }} className="py-2">
                  <Skeleton className="w-24 h-3 bg-secondary" />
                </div>
              ) : (
                expandedDirs[file.path] && renderTree(expandedDirs[file.path], level + 1)
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const filteredRepos = repos?.filter(r => r.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="flex h-full w-full">
      {/* Col 1: Repositories */}
      <div className="w-[300px] border-r border-border flex flex-col bg-card/50">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <GitFork className="w-4 h-4" /> Repositories
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Find repository..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background border-border text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {isLoadingRepos ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-full h-14 bg-secondary rounded-md" />)
          ) : (
            filteredRepos.map(repo => (
              <div 
                key={repo.id}
                onClick={() => { setSelectedRepo(repo); setOpenDirs(new Set()); setActiveFile(null); }}
                className={cn(
                  "p-3 rounded-md cursor-pointer border transition-all",
                  selectedRepo?.id === repo.id 
                    ? "bg-secondary border-primary/50" 
                    : "border-transparent hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground truncate">{repo.name}</span>
                  {repo.private ? <Lock className="w-3 h-3 text-muted-foreground ml-auto" /> : <Globe className="w-3 h-3 text-muted-foreground ml-auto" />}
                </div>
                {repo.language && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {repo.language}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Col 2: File Tree */}
      <div className="w-[280px] border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border h-[61px] flex items-center">
          <h2 className="font-semibold text-sm text-foreground truncate">
            {selectedRepo ? selectedRepo.name : "Select a repo"}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar font-mono">
          {!selectedRepo ? (
            <div className="text-center text-xs text-muted-foreground p-8">No repository selected</div>
          ) : isLoadingRoot ? (
            <div className="space-y-2 p-2">
              <Skeleton className="w-3/4 h-4 bg-secondary" />
              <Skeleton className="w-1/2 h-4 bg-secondary" />
              <Skeleton className="w-2/3 h-4 bg-secondary" />
            </div>
          ) : rootContents ? (
            renderTree(rootContents)
          ) : (
            <div className="text-center text-xs text-muted-foreground p-8">Empty repository</div>
          )}
        </div>
      </div>

      {/* Col 3: File Viewer */}
      <div className="flex-1 flex flex-col bg-[#030910] min-w-0">
        {isLoadingFile ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm text-muted-foreground font-mono">Loading file...</span>
            </div>
          </div>
        ) : !activeFile ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Code className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a file to view code</p>
          </div>
        ) : (
          <>
            <div className="h-[61px] border-b border-border/50 px-4 flex items-center justify-between bg-card/50 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-mono text-foreground/80 truncate max-w-[50%]">
                <FileIcon name={activeFile.path.split('/').pop() || ''} />
                <span className="truncate">{activeFile.path}</span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {!isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="h-8 border-border bg-transparent text-foreground hover:bg-secondary"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleAskFarobot}
                      className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_10px_rgba(57,255,20,0.2)]"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1.5" /> Ask FaroBot to fix this
                    </Button>
                  </>
                ) : (
                  <>
                    <Input 
                      value={editMessage}
                      onChange={e => setEditMessage(e.target.value)}
                      className="h-8 w-48 text-xs bg-background border-border"
                      placeholder="Commit message"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setIsEditing(false); setEditContent(activeFile.content); }}
                      className="h-8 border-border bg-transparent text-foreground hover:bg-secondary"
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={updateFile.isPending || editContent === activeFile.content}
                      className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Save className="w-3.5 h-3.5 mr-1.5" /> {updateFile.isPending ? 'Saving...' : 'Commit'}
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              {isEditing ? (
                <Textarea 
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="min-h-full w-full bg-transparent border-0 focus-visible:ring-0 text-foreground/90 font-mono text-[13px] leading-relaxed p-4 resize-none"
                  spellCheck={false}
                />
              ) : (
                <pre className="p-4 font-mono text-[13px] leading-relaxed text-foreground/90 w-full min-h-full">
                  <code>{activeFile.content}</code>
                </pre>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
