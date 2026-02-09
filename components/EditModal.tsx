import React, { useState, useEffect } from 'react';
import { PageComponent, ComponentType } from '../types';
import { Button, Input, Select } from './ui';
import { X, Plus, Trash2 } from 'lucide-react';

interface EditModalProps {
    component: PageComponent;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<PageComponent>) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ component, isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [width, setWidth] = useState<'50%' | '100%'>('100%');
    const [role, setRole] = useState<'admin' | 'viewer' | 'both'>('both');
    const [apiSource, setApiSource] = useState('');
    const [textContent, setTextContent] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [sections, setSections] = useState<{title: string, content: string}[]>([]);

    useEffect(() => {
        if (component) {
            setTitle(component.data.title || '');
            setSubtitle(component.data.subtitle || '');
            setWidth(component.width);
            setRole(component.role);
            setApiSource(component.apiSource || '');
            setTextContent(component.data.text || '');
            // Consolidate media URL access
            setMediaUrl(
                component.data.image || 
                component.data.pdfUrl || 
                component.data.videoUrl || 
                ''
            );
            setSections(component.data.sections || []);
        }
    }, [component, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        const updates: any = {
            width,
            role,
            apiSource,
            data: { ...component.data, title, subtitle }
        };

        if (component.type === ComponentType.PARAGRAPH) {
            updates.data.text = textContent;
            updates.data.sections = sections;
        } else if (component.type === ComponentType.IMAGE_VIEWER || component.type === ComponentType.HERO) {
            updates.data.image = mediaUrl;
        } else if (component.type === ComponentType.PDF_VIEWER) {
            updates.data.pdfUrl = mediaUrl;
        } else if (component.type === ComponentType.VIDEO_PLAYER) {
            updates.data.videoUrl = mediaUrl;
        }

        onSave(component.id, updates);
        onClose();
    };

    const addSection = () => {
        setSections([...sections, { title: '', content: '' }]);
    };

    const removeSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const updateSection = (index: number, field: 'title' | 'content', value: string) => {
        const newSections = [...sections];
        newSections[index][field] = value;
        setSections(newSections);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-lg">Edit Component</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Component Type</label>
                        <Input value={component.type} disabled className="bg-muted" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-2 bg-secondary/30 rounded border border-border/50">
                            <label className="text-sm font-medium mb-1 block text-primary">Width (Page Size)</label>
                            <Select value={width} onChange={(e) => setWidth(e.target.value as any)}>
                                <option value="50%">Half Width (50%)</option>
                                <option value="100%">Full Width (100%)</option>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Visible To</label>
                            <Select value={role} onChange={(e) => setRole(e.target.value as any)}>
                                <option value="both">Everyone</option>
                                <option value="admin">Admin Only</option>
                                <option value="viewer">Viewer Only</option>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                         <h4 className="font-medium text-sm text-muted-foreground uppercase">Content</h4>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Title</label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Component Title" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Subtitle</label>
                            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optional Subtitle" />
                        </div>

                        {/* Specific Inputs based on type */}
                        {component.type === ComponentType.PARAGRAPH && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Main Body Text</label>
                                    <textarea 
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={textContent}
                                        onChange={(e) => setTextContent(e.target.value)}
                                        placeholder="Enter main paragraph text..."
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium block">Additional Sections</label>
                                        <Button size="sm" variant="outline" onClick={addSection} type="button">
                                            <Plus className="h-3 w-3 mr-1" /> Add Section
                                        </Button>
                                    </div>
                                    
                                    {sections.map((section, idx) => (
                                        <div key={idx} className="border border-border rounded-md p-3 bg-secondary/10 relative">
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                className="absolute top-2 right-2 h-6 w-6" 
                                                onClick={() => removeSection(idx)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                            <Input 
                                                placeholder="Subsection Title" 
                                                value={section.title} 
                                                onChange={(e) => updateSection(idx, 'title', e.target.value)} 
                                                className="mb-2 h-8 text-sm font-normal pr-8"
                                            />
                                            <textarea 
                                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                value={section.content}
                                                onChange={(e) => updateSection(idx, 'content', e.target.value)}
                                                placeholder="Subsection content..."
                                                rows={3}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(component.type === ComponentType.IMAGE_VIEWER || 
                          component.type === ComponentType.PDF_VIEWER ||
                          component.type === ComponentType.VIDEO_PLAYER ||
                          component.type === ComponentType.HERO) && (
                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    {component.type === ComponentType.HERO ? 'Background Image URL' : 'Media URL'}
                                </label>
                                <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://..." />
                            </div>
                        )}

                        {[ComponentType.TABLE, ComponentType.CHART_BAR, ComponentType.CHART_LINE, ComponentType.CHART_PIE, ComponentType.CHART_AREA].includes(component.type) && (
                            <div>
                                <label className="text-sm font-medium mb-1 block">API Source</label>
                                <Input value={apiSource} onChange={(e) => setApiSource(e.target.value)} placeholder="API Endpoint URL" />
                                <p className="text-[10px] text-muted-foreground mt-1">Changing this URL requires page reload to fetch new data in this demo.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};
