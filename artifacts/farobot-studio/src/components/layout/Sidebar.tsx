import { Link, useLocation } from "wouter";
import { Zap, Plus, Trash2, GitBranch, Settings, MessageSquare, ChevronDown } from "lucide-react";
import { 
  useListConversations, 
  useDeleteConversation, 
  useGetGithubStatus, 
  useListModels,
  useGetSettings,
  getListConversationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: conversations, isLoading: isLoadingConvos } = useListConversations();
  const { data: githubStatus, isLoading: isLoadingGithub } = useGetGithubStatus();
  const { data: models } = useListModels();
  const { data: settings } = useGetSettings();
  
  const deleteConvo = useDeleteConversation();
  
  const [selectedModel, setSelectedModel] = useState<string>("");

  // Determine active conversation id from URL
  const activeIdMatch = location.match(/^\/c\/(\d+)$/);
  const activeId = activeIdMatch ? Number(activeIdMatch[1]) : null;

  const currentModel = selectedModel || settings?.defaultModel || (models?.[0]?.id ?? "");

  const handleNewChat = () => {
    setLocation("/");
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConvo.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        if (activeId === id) {
          setLocation("/");
        }
      }
    });
  };

  return (
    <div className="w-[260px] h-screen flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col z-10">
      {/* Header */}
      <div className="p-4 flex items-center gap-2">
        <Zap className="text-primary w-6 h-6" />
        <span className="font-bold text-lg text-primary neon-glow tracking-wide">FaroBot Studio</span>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <Button 
          onClick={handleNewChat}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Model Selector */}
      <div className="px-4 mb-4">
        <Select value={currentModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-full h-8 text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-popover-border">
            {models?.map((model) => (
              <SelectItem key={model.id} value={model.id} className="text-xs">
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        {isLoadingConvos ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-10 bg-sidebar-accent/50 rounded-md" />
          ))
        ) : conversations?.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground p-4">
            No conversations yet
          </div>
        ) : (
          conversations?.map((convo) => {
            const isActive = activeId === convo.id;
            return (
              <Link key={convo.id} href={`/c/${convo.id}`}>
                <div 
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-l-md neon-glow" />
                  )}
                  <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <div className="flex-1 truncate">
                    {convo.title || "Untitled Chat"}
                  </div>
                  
                  <button 
                    onClick={(e) => handleDelete(e, convo.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer Navigation & Status */}
      <div className="mt-auto border-t border-sidebar-border p-2 space-y-1">
        <Link href="/github">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
            location === "/github" ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          )}>
            <GitBranch className="w-4 h-4" />
            <span>GitHub Explorer</span>
          </div>
        </Link>
        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
            location === "/settings" ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          )}>
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </Link>
        
        <div className="pt-2 mt-2 border-t border-sidebar-border px-3 py-2">
          {isLoadingGithub ? (
            <Skeleton className="w-full h-4 bg-sidebar-accent/50" />
          ) : githubStatus?.connected ? (
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <div className="w-2 h-2 rounded-full bg-primary neon-glow" />
              GitHub Connected
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              GitHub Disconnected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
