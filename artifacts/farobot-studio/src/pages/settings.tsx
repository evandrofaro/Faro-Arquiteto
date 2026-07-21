import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { 
  useGetSettings, 
  useUpdateSettings, 
  useListModels, 
  useGetGithubStatus,
  SettingsUpdate 
} from "@workspace/api-client-react";
import { Settings as SettingsIcon, Github, Save, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const { data: settings, isLoading: isLoadingSettings } = useGetSettings();
  const { data: models } = useListModels();
  const { data: githubStatus, isLoading: isLoadingGithub } = useGetGithubStatus();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const form = useForm<SettingsUpdate>({
    defaultValues: {
      defaultModel: "",
      huggingfaceToken: "",
      systemPrompt: ""
    }
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        defaultModel: settings.defaultModel,
        huggingfaceToken: settings.huggingfaceToken || "",
        systemPrompt: settings.systemPrompt
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsUpdate) => {
    // Only send token if it has changed from the masked version
    const payload = { ...data };
    if (settings?.huggingfaceToken && payload.huggingfaceToken === settings.huggingfaceToken) {
      delete payload.huggingfaceToken;
    }

    updateSettings.mutate({ data: payload }, {
      onSuccess: () => {
        toast({
          title: "Settings saved",
          description: "Your preferences have been updated successfully.",
          className: "bg-card border-primary text-foreground"
        });
      },
      onError: () => {
        toast({
          title: "Error saving settings",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoadingSettings) {
    return (
      <div className="p-8 max-w-2xl mx-auto w-full space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <span>FaroBot Studio</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1" />
            <span className="text-foreground font-medium">Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Preferences
          </h1>
        </div>

        <div className="grid gap-8">
          {/* AI Settings Form */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-6">AI Configuration</h2>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">HuggingFace API Token</label>
                <div className="relative">
                  <Input 
                    type="password" 
                    {...form.register("huggingfaceToken")}
                    className="bg-background border-border font-mono text-sm"
                    placeholder="hf_..."
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Required to access premium coding models. Your token is stored securely locally.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Default Model</label>
                <Select 
                  value={form.watch("defaultModel")} 
                  onValueChange={(val) => form.setValue("defaultModel", val)}
                >
                  <SelectTrigger className="bg-background border-border w-full max-w-md">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-popover-border">
                    {models?.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">System Prompt</label>
                <Textarea 
                  {...form.register("systemPrompt")}
                  rows={4}
                  className="bg-background border-border font-mono text-sm resize-y"
                  placeholder="You are an expert software engineer..."
                />
                <p className="text-xs text-muted-foreground">
                  This prompt defines FaroBot's personality and behavior across all conversations.
                </p>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateSettings.isPending || !form.formState.isDirty}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
                >
                  {updateSettings.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* GitHub Connection */}
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Connection
            </h2>

            {isLoadingGithub ? (
              <Skeleton className="h-16 w-full" />
            ) : githubStatus?.connected ? (
              <div className="flex items-center justify-between bg-background border border-primary/30 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border border-primary/50">
                    {githubStatus.avatarUrl ? <AvatarImage src={githubStatus.avatarUrl} /> : null}
                    <AvatarFallback className="bg-secondary text-primary">GH</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{githubStatus.username || 'Connected User'}</span>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Successfully authenticated with GitHub</p>
                  </div>
                </div>
                <Link href="/github">
                  <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                    Browse Repositories
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-background border border-border p-4 rounded-lg">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Not connected</span>
                  <p className="text-xs text-muted-foreground mt-0.5">Connect your GitHub account to review and edit code</p>
                </div>
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                  Connect GitHub
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
