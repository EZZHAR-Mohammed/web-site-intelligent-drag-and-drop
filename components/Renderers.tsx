import React from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, AreaChart, Area } from 'recharts';
import { ComponentType, PageComponent } from '../types';
import { Card, Badge, Button } from './ui';
import { FileText, Image as ImageIcon, ExternalLink, Trash2, ArrowUp, ArrowDown, Settings, MoveHorizontal, Maximize2, Minimize2, Play } from 'lucide-react';

// --- Colors for Charts ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// --- Renderer Props ---
interface RendererProps {
  component: PageComponent;
  isEditMode: boolean;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleWidth?: (id: string) => void;
}

// --- Wrapper for consistent layout/controls ---
const ComponentWrapper: React.FC<RendererProps & { children: React.ReactNode }> = ({ 
  component, isEditMode, onDelete, onMoveUp, onMoveDown, onEdit, onToggleWidth, children 
}) => {
  const isFullWidth = component.width === '100%';

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-md h-full flex flex-col group ${isFullWidth ? 'col-span-1 md:col-span-2' : 'col-span-1'}`}>
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 bg-white/95 p-1 rounded-md shadow-sm border border-border no-print opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onEdit(component.id)} title="Edit Component"><Settings className="h-3.5 w-3.5" /></Button>
            
            {/* Quick Width Toggle */}
            {onToggleWidth && (
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onToggleWidth(component.id)} title={isFullWidth ? "Make Half Width" : "Make Full Width"}>
                  {isFullWidth ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            )}
            
            <div className="w-px bg-border mx-1"></div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveUp(component.id)}><ArrowUp className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveDown(component.id)}><ArrowDown className="h-3.5 w-3.5" /></Button>
            <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => onDelete(component.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      )}
      
      {isEditMode && (
          <div className="absolute top-2 left-2 z-10 no-print pointer-events-none">
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">{component.type}</Badge>
              {component.apiSource && <span className="ml-2 text-[10px] text-muted-foreground bg-secondary/50 px-1 rounded truncate max-w-[150px] inline-block align-middle">API: {component.apiSource}</span>}
          </div>
      )}

      {component.type === ComponentType.HERO ? (
        // Hero has specific layout, renders children directly
        children
      ) : (
        <div className="p-6 flex-grow flex flex-col">
          {component.data.title && component.type !== ComponentType.DIVIDER && <h3 className="text-lg font-semibold mb-1">{component.data.title}</h3>}
          {component.data.subtitle && component.type !== ComponentType.DIVIDER && <h4 className="text-md font-semibold mb-4 text-foreground/80">{component.data.subtitle}</h4>}
          <div className="flex-grow w-full">
              {children}
          </div>
        </div>
      )}
    </Card>
  );
};

// --- Individual Renderers ---

const TableRenderer: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-muted-foreground">No data available</p>;
  const keys = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
          <tr>
            {keys.map(k => <th key={k} className="px-4 py-3 rounded-t">{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
              {keys.map(k => <td key={k} className="px-4 py-3">{typeof row[k] === 'object' ? JSON.stringify(row[k]) : row[k]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StatCardRenderer: React.FC<{ data: any }> = ({ data }) => (
  <div className="flex flex-col items-center justify-center h-full text-center py-4">
    <div className="text-4xl font-bold text-primary mb-2">{data.value}</div>
    {data.subtitle && <div className="text-sm text-muted-foreground">{data.subtitle}</div>}
  </div>
);

const ComplexCardRenderer: React.FC<{ data: any }> = ({ data }) => (
  <div className="flex flex-col md:flex-row gap-4">
    {data.image && (
        <div className="w-full md:w-1/3 aspect-video md:aspect-square relative rounded-md overflow-hidden bg-muted">
            <img src={data.image} alt={data.title} className="object-cover w-full h-full" />
        </div>
    )}
    <div className="flex-1">
        <p className="text-sm text-foreground/80 mb-4">{data.text}</p>
        {data.points && (
            <ul className="space-y-1">
                {data.points.map((p: string, i: number) => (
                    <li key={i} className="text-sm flex items-start">
                        <span className="mr-2 text-primary">•</span>{p}
                    </li>
                ))}
            </ul>
        )}
         {data.value && <div className="mt-4 text-xl font-bold">{data.value}</div>}
    </div>
  </div>
);

const ChartRenderer: React.FC<{ type: ComponentType, data: any[] }> = ({ type, data }) => {
  if (!data || data.length === 0) return <div>No Chart Data</div>;
  const keys = Object.keys(data[0]);
  const dataKey = keys.find(k => typeof data[0][k] === 'number') || keys[1]; // Heuristic
  const labelKey = keys.find(k => typeof data[0][k] === 'string') || keys[0];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {type === ComponentType.CHART_BAR ? (
           <BarChart data={data}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} />
             <XAxis dataKey={labelKey} tick={{fontSize: 12}} />
             <YAxis tick={{fontSize: 12}} />
             <Tooltip />
             <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
           </BarChart>
        ) : type === ComponentType.CHART_LINE ? (
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={labelKey} tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
        ) : type === ComponentType.CHART_AREA ? (
             <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={labelKey} tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey={dataKey} stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
        ) : (
            <PieChart>
                <Pie data={data} dataKey={dataKey} nameKey={labelKey} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

const PDFRenderer: React.FC<{ url: string }> = ({ url }) => {
  const safeUrl = url || '';
  return (
    <div className="w-full h-[600px] bg-muted rounded-md overflow-hidden border border-border">
      {safeUrl ? (
        <object 
            data={safeUrl} 
            type="application/pdf" 
            className="w-full h-full"
        >
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
                <p>Unable to display PDF directly.</p>
                <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                    <ExternalLink className="mr-1 h-4 w-4"/> Download PDF
                </a>
            </div>
        </object>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No PDF URL provided
        </div>
      )}
    </div>
  );
};

const ImageViewerRenderer: React.FC<{ url: string }> = ({ url }) => (
    <div className="rounded-md overflow-hidden bg-black/5 flex items-center justify-center border border-border">
        {url ? (
          <img 
            src={url} 
            alt="Preview" 
            className="max-h-[500px] w-full object-contain" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Load+Error';
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">No Image URL</div>
        )}
    </div>
);

const VideoRenderer: React.FC<{ url: string }> = ({ url }) => {
  const isYoutube = url?.includes('youtube.com') || url?.includes('youtu.be');
  let embedUrl = url;
  
  if (isYoutube) {
    // Simple parser for YoutTube ID
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  return (
    <div className="rounded-md overflow-hidden bg-black flex items-center justify-center border border-border aspect-video">
        {url ? (
           isYoutube ? (
             <iframe 
                src={embedUrl} 
                className="w-full h-full" 
                title="Video Player" 
                allowFullScreen
                frameBorder="0"
             />
           ) : (
             <video controls className="w-full h-full">
                <source src={url} type="video/mp4" />
                Your browser does not support the video tag.
             </video>
           )
        ) : (
           <div className="flex items-center text-muted-foreground"><Play className="mr-2 h-4 w-4"/> No Video Source</div>
        )}
    </div>
  );
}

const HeroRenderer: React.FC<{ data: any }> = ({ data }) => (
    <div className="relative w-full h-[400px] flex items-center justify-center text-center text-white overflow-hidden rounded-md">
        {data.image && (
            <div className="absolute inset-0 z-0">
                <img src={data.image} alt="Hero Background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50" />
            </div>
        )}
        <div className="relative z-10 p-6 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.title}</h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">{data.subtitle}</p>
        </div>
    </div>
);

const DividerRenderer: React.FC = () => (
    <div className="flex items-center justify-center py-4">
        <div className="h-px bg-border w-full"></div>
    </div>
);


// --- Main Switch ---
export const ComponentRenderer: React.FC<RendererProps> = (props) => {
  const { component } = props;
  
  return (
    <ComponentWrapper {...props}>
      {(() => {
        switch (component.type) {
          case ComponentType.TABLE:
            return <TableRenderer data={component.data.dataset || []} />;
          case ComponentType.STAT_CARD:
            return <StatCardRenderer data={component.data} />;
          case ComponentType.COMPLEX_CARD:
            return <ComplexCardRenderer data={component.data} />;
          case ComponentType.CHART_BAR:
          case ComponentType.CHART_LINE:
          case ComponentType.CHART_PIE:
          case ComponentType.CHART_AREA:
            return <ChartRenderer type={component.type} data={component.data.dataset || []} />;
          case ComponentType.PDF_VIEWER:
            return <PDFRenderer url={component.data.pdfUrl || ''} />;
          case ComponentType.IMAGE_VIEWER:
            return <ImageViewerRenderer url={component.data.image || ''} />;
          case ComponentType.VIDEO_PLAYER:
            return <VideoRenderer url={component.data.videoUrl || ''} />;
          case ComponentType.HERO:
            return <HeroRenderer data={component.data} />;
          case ComponentType.DIVIDER:
            return <DividerRenderer />;
          case ComponentType.PARAGRAPH:
            return (
              <div className="space-y-4">
                 {component.data.text && <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">{component.data.text}</p>}
                 {component.data.sections && component.data.sections.map((section, idx) => (
                    <div key={idx} className="mt-4 pt-2 border-t border-border/40">
                        {section.title && <h4 className="text-md font-semibold mb-2 text-foreground/80">{section.title}</h4>}
                        {section.content && <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">{section.content}</p>}
                    </div>
                 ))}
              </div>
            );
          default:
            return <div>Unknown Component</div>;
        }
      })()}
    </ComponentWrapper>
  );
};