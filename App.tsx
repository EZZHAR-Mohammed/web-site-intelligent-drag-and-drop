import React, { useState, useRef } from 'react';
import { 
  ComponentType, 
  PageComponent, 
  Role, 
  Suggestion,
  ComponentData
} from './types';
import { analyzeApiData } from './lib/apiAnalyzer';
import { MOCK_API_RESPONSES } from './constants';
import { ComponentRenderer } from './components/Renderers';
import { Button, Input, Select, Badge, Card } from './components/ui';
import { EditModal } from './components/EditModal';
import { 
  Layout, 
  Eye, 
  Edit3, 
  Save, 
  Download, 
  Plus, 
  Search,
  Settings,
  Wand2,
  FileCode,
  Type,
  Video,
  CreditCard,
  SeparatorHorizontal,
  FileText
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  // State
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [role, setRole] = useState<Role>('admin');
  const [isEditMode, setIsEditMode] = useState(true);
  const [apiUrl, setApiUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Edit Modal State
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Handlers
  const handleAnalyze = async () => {
    setIsLoading(true);
    setSuggestions([]);
    
    // Simulate API delay
    setTimeout(() => {
      let data;
      // Improved logic: Check extensions first, then fallback to mocks
      if (apiUrl.match(/\.(jpeg|jpg|png|webp|gif|bmp)(\?.*)?$/i) || apiUrl.includes('picsum.photos')) data = apiUrl; 
      else if (apiUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) || apiUrl.includes('youtube.com')) data = apiUrl;
      else if (apiUrl.includes('sales')) data = MOCK_API_RESPONSES['sales-data'];
      else if (apiUrl.includes('user')) data = MOCK_API_RESPONSES['user-stats'];
      else if (apiUrl.includes('product')) data = MOCK_API_RESPONSES['product-info'];
      else if (apiUrl.includes('.pdf')) data = { url: apiUrl }; 
      else if (apiUrl.includes('http')) data = MOCK_API_RESPONSES['sales-data']; // Fallback
      else data = MOCK_API_RESPONSES['sales-data']; // Default fallback

      const foundSuggestions = analyzeApiData(data, apiUrl);
      setSuggestions(foundSuggestions);
      setShowSuggestions(true);
      setIsLoading(false);
    }, 800);
  };

  const addComponent = (suggestion: Suggestion) => {
    const newComponent: PageComponent = {
      id: crypto.randomUUID(),
      type: suggestion.type,
      width: [
          ComponentType.TABLE, 
          ComponentType.CHART_LINE, 
          ComponentType.CHART_AREA, 
          ComponentType.PDF_VIEWER,
          ComponentType.HERO,
          ComponentType.DIVIDER
      ].includes(suggestion.type) ? '100%' : '50%',
      role: 'both',
      apiSource: apiUrl,
      data: suggestion.previewData || {}
    };
    setComponents([...components, newComponent]);
    setShowSuggestions(false);
    setApiUrl('');
  };

  const addManualComponent = (type: ComponentType) => {
      const newComponent: PageComponent = {
          id: crypto.randomUUID(),
          type: type,
          width: '100%',
          role: 'both',
          apiSource: '',
          data: {
              title: "New Component",
              subtitle: "",
              text: "Edit this text.",
              sections: [],
              image: ""
          }
      };
      setComponents([...components, newComponent]);
      // For dividers, we typically don't need immediate editing
      if (type !== ComponentType.DIVIDER) {
          setEditingId(newComponent.id);
      }
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const index = components.findIndex(c => c.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === components.length - 1) return;

    const newComponents = [...components];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newComponents[index], newComponents[targetIndex]] = [newComponents[targetIndex], newComponents[index]];
    setComponents(newComponents);
  };

  const toggleWidth = (id: string) => {
      setComponents(components.map(c => 
          c.id === id ? { ...c, width: c.width === '100%' ? '50%' : '100%' } : c
      ));
  };

  const saveComponentUpdates = (id: string, updates: Partial<PageComponent>) => {
      setComponents(components.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(components, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "page_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportHTML = () => {
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'page_export.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleExportPDF = async () => {
      const element = document.getElementById('canvas-area');
      if (!element) return;

      const wasEditMode = isEditMode;
      setIsEditMode(false);
      
      // Pre-process images to Base64 to avoid CORS issues in PDF
      const images = Array.from(element.querySelectorAll('img'));
      const originalSrcs = new Map<HTMLImageElement, string>();

      // Wait for UI to update (removing edit controls)
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // Try to convert all images to Base64
        await Promise.all(images.map(async (img) => {
            try {
                if (!img.src || img.src.startsWith('data:')) return;
                originalSrcs.set(img, img.src);
                
                // Add anonymous crossOrigin if not present
                if (!img.crossOrigin) img.crossOrigin = 'anonymous';

                const response = await fetch(img.src, { mode: 'cors' });
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onloadend = () => {
                        img.src = reader.result as string;
                        resolve(null);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.warn('Image CORS conversion failed, pdf might be incomplete for:', img.src);
            }
        }));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true, 
            imageTimeout: 15000
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        pdf.save('page_export.pdf');

      } catch (err) {
          console.error("PDF Export failed:", err);
          alert("Could not generate PDF. If images are missing, they may be blocked by security policies (CORS).");
      } finally {
          // Restore original image sources
          originalSrcs.forEach((src, img) => {
              img.src = src;
          });
          setIsEditMode(wasEditMode);
      }
  };

  // Filter components based on Role
  const visibleComponents = components.filter(c => 
    role === 'admin' || c.role === 'both' || c.role === role
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* --- Navbar --- */}
      <header className="border-b border-border bg-card sticky top-0 z-30 no-print">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="h-6 w-6 text-primary" />
            <h1 className="font-bold text-xl hidden md:block">AutoPage Builder</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-md">
                <Button 
                    size="sm" 
                    variant={role === 'admin' ? 'primary' : 'ghost'} 
                    onClick={() => setRole('admin')}
                >
                    Admin
                </Button>
                <Button 
                    size="sm" 
                    variant={role === 'viewer' ? 'primary' : 'ghost'} 
                    onClick={() => { setRole('viewer'); setIsEditMode(false); }}
                >
                    Viewer
                </Button>
            </div>

            <div className="h-6 w-px bg-border mx-2"></div>

            {role === 'admin' && (
                <div className="flex items-center gap-2">
                     <Button 
                        size="sm" 
                        variant={isEditMode ? 'secondary' : 'ghost'} 
                        onClick={() => setIsEditMode(!isEditMode)}
                    >
                        {isEditMode ? <Eye className="mr-2 h-4 w-4"/> : <Edit3 className="mr-2 h-4 w-4"/>}
                        {isEditMode ? 'Preview' : 'Edit'}
                    </Button>
                     <Button size="sm" variant="outline" onClick={handleExportJSON} title="Save Config">
                        <Save className="mr-2 h-4 w-4"/> JSON
                    </Button>
                </div>
            )}
             <Button size="sm" variant="outline" onClick={handleExportHTML} title="Download HTML">
                <FileCode className="mr-2 h-4 w-4"/> HTML
            </Button>
             <Button size="sm" variant="outline" onClick={handleExportPDF} title="Download PDF">
                <Download className="mr-2 h-4 w-4"/> PDF
            </Button>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-grow container mx-auto px-4 py-8">
        
        {/* --- Builder Controls (Admin Only) --- */}
        {role === 'admin' && isEditMode && (
          <div className="mb-8 space-y-6 no-print">
            
            {/* API Analyzer */}
            <div className="p-6 bg-card rounded-lg border border-border shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Wand2 className="mr-2 h-5 w-5 text-primary" /> 
                    Add Component via API
                </h2>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-grow relative">
                    <Input 
                    placeholder="Enter URL: API, Image (.png/jpg), Video (youtube/mp4), or PDF" 
                    value={apiUrl} 
                    onChange={(e) => setApiUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                <Button onClick={handleAnalyze} disabled={isLoading || !apiUrl}>
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                </Button>
                </div>

                {/* Suggestions Panel */}
                {showSuggestions && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Detected Structure & Recommendations:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {suggestions.map((s, i) => (
                        <button
                        key={i}
                        onClick={() => addComponent(s)}
                        className="flex flex-col items-start p-4 rounded-md border border-border bg-background hover:bg-accent hover:border-primary transition-all text-left group"
                        >
                        <div className="flex justify-between w-full mb-2">
                            <Badge variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                                {s.type}
                            </Badge>
                            <span className="text-xs text-green-600 font-bold">{(s.confidence * 100).toFixed(0)}% Match</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.reason}</p>
                        </button>
                    ))}
                    {suggestions.length === 0 && (
                        <p className="text-sm text-muted-foreground">No clear pattern detected. Try another URL.</p>
                    )}
                    </div>
                </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center">Quick Mocks:</span>
                    <Button size="sm" variant="ghost" onClick={() => setApiUrl('https://api.mock/sales-data')}>Sales Data</Button>
                    <Button size="sm" variant="ghost" onClick={() => setApiUrl('https://api.mock/product-info')}>Product</Button>
                    <Button size="sm" variant="ghost" onClick={() => setApiUrl('https://pdfobject.com/pdf/sample.pdf')}>PDF Report</Button>
                    <Button size="sm" variant="ghost" onClick={() => setApiUrl('https://picsum.photos/800/600')}>Image</Button>
                    <Button size="sm" variant="ghost" onClick={() => setApiUrl('https://www.youtube.com/watch?v=LXb3EKWsInQ')}>Video</Button>
                </div>
            </div>

            {/* Manual Add */}
            <div className="p-6 bg-card rounded-lg border border-border shadow-sm">
                 <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Plus className="mr-2 h-5 w-5 text-primary" /> 
                    Add Manual Content
                </h2>
                <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => addManualComponent(ComponentType.PARAGRAPH)}>
                        <Type className="mr-2 h-4 w-4" /> Paragraph Section
                    </Button>
                    <Button variant="secondary" onClick={() => addManualComponent(ComponentType.DIVIDER)}>
                        <SeparatorHorizontal className="mr-2 h-4 w-4" /> Divider
                    </Button>
                </div>
            </div>
          </div>
        )}

        {/* --- Canvas Area --- */}
        <div id="canvas-area" className="p-2 bg-background min-h-[500px]">
            {components.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-secondary/20">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                        <Layout className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium">Your page is empty</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        {role === 'admin' 
                            ? "Use the panels above to add components via API or manually." 
                            : "This page has no content yet."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-min">
                    {visibleComponents.map((component) => (
                        <ComponentRenderer 
                            key={component.id} 
                            component={component} 
                            isEditMode={isEditMode && role === 'admin'}
                            onDelete={removeComponent}
                            onMoveUp={(id) => moveComponent(id, 'up')}
                            onMoveDown={(id) => moveComponent(id, 'down')}
                            onEdit={(id) => setEditingId(id)}
                            onToggleWidth={toggleWidth}
                        />
                    ))}
                </div>
            )}
        </div>

      </main>
      
      <footer className="border-t border-border bg-card py-6 mt-8 no-print">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>AutoPage Builder &copy; {new Date().getFullYear()}</p>
          </div>
      </footer>

      {/* Edit Modal */}
      {editingId && (
          <EditModal 
            component={components.find(c => c.id === editingId)!}
            isOpen={!!editingId}
            onClose={() => setEditingId(null)}
            onSave={saveComponentUpdates}
          />
      )}

    </div>
  );
};

export default App;