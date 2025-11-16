import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Community } from '@/components/Community';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CalendarDays, BookOpen, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  timestamp: number;
}

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isCommunityMode, setIsCommunityMode] = useState(false);

  // Load entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
  }, [entries]);

  const saveEntry = () => {
    if (!currentTitle.trim() || !currentContent.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: currentTitle,
      content: currentContent,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now()
    };

    setEntries(prev => [newEntry, ...prev]);
    setCurrentTitle('');
    setCurrentContent('');
    setIsWriting(false);
    toast.success('Journal entry saved!');
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCurrentTitle(`Imported - ${file.name}`);
      setCurrentContent(content);
      setIsWriting(true);
      toast.success('File imported! You can now edit and save it.');
    };
    reader.readAsText(file);
  };

  if (isCommunityMode) {
    return <Community onToggle={() => setIsCommunityMode(false)} />;
  }

  return (
    <DashboardLayout userType="student" onCommunityToggle={() => setIsCommunityMode(true)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              My Journal
            </h1>
            <p className="text-muted-foreground mt-2">
              Write about your daily experiences and reflect on your journey
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleFileImport}
              className="hidden"
              id="file-import"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-import')?.click()}
              className="glass-card"
            >
              <FileText className="w-4 h-4 mr-2" />
              Import Journal
            </Button>
            <Button
              onClick={() => {
                setIsWriting(true);
                setSelectedEntry(null);
                setCurrentTitle('');
                setCurrentContent('');
              }}
              className="glass-card bg-gradient-primary text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry List */}
          <div className="lg:col-span-1">
            <Card className="glass-card h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-wellness-calm" />
                  Previous Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No journal entries yet. Start writing your first entry!
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => {
                          setSelectedEntry(entry);
                          setIsWriting(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedEntry?.id === entry.id
                            ? 'bg-gradient-primary text-white'
                            : 'hover:bg-white/20 dark:hover:bg-gray-800/20'
                        }`}
                      >
                        <h4 className="font-medium truncate">{entry.title}</h4>
                        <div className="flex items-center mt-1 opacity-75">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          <span className="text-xs">{entry.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Writing/Reading Area */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>
                  {isWriting ? 'Write New Entry' : selectedEntry ? 'Reading Entry' : 'Select an entry to read or write a new one'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isWriting ? (
                  <>
                    <Input
                      placeholder="Entry title..."
                      value={currentTitle}
                      onChange={(e) => setCurrentTitle(e.target.value)}
                      className="glass-card"
                    />
                    <Textarea
                      placeholder="Write about your day, thoughts, feelings, or experiences..."
                      value={currentContent}
                      onChange={(e) => setCurrentContent(e.target.value)}
                      className="glass-card min-h-[400px] resize-none"
                    />
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsWriting(false);
                          setCurrentTitle('');
                          setCurrentContent('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveEntry} className="bg-gradient-primary text-white">
                        Save Entry
                      </Button>
                    </div>
                  </>
                ) : selectedEntry ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">{selectedEntry.title}</h3>
                      <div className="flex items-center text-muted-foreground">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {selectedEntry.date}
                      </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap leading-relaxed">{selectedEntry.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select an entry from the list to read, or create a new one to start writing.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};