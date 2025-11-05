import { useState, useRef, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isReference?: boolean;
}

const Index = () => {
  const [elements, setElements] = useState<ImageElement[]>([]);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isReference = false) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newElement: ImageElement = {
            id: `element-${Date.now()}-${Math.random()}`,
            src: event.target?.result as string,
            x: isReference ? 400 : Math.random() * 200 + 100,
            y: isReference ? 200 : Math.random() * 200 + 100,
            width: Math.min(img.width, 200),
            height: Math.min(img.height, 200),
            isReference,
          };
          setElements((prev) => [...prev, newElement]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    toast({
      title: isReference ? 'Эталон загружен' : 'Элементы загружены',
      description: `Файлов: ${files.length}`,
    });
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedElement(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setElements((prev) =>
      prev.map((el) =>
        el.id === draggedElement ? { ...el, x: x - el.width / 2, y: y - el.height / 2 } : el
      )
    );
    setDraggedElement(null);
  };

  const alignToReference = () => {
    const reference = elements.find((el) => el.isReference);
    if (!reference) {
      toast({
        title: 'Ошибка',
        description: 'Сначала загрузите эталонный элемент',
        variant: 'destructive',
      });
      return;
    }

    const refCenterX = reference.x + reference.width / 2;
    const refCenterY = reference.y + reference.height / 2;

    setElements((prev) =>
      prev.map((el) =>
        el.isReference
          ? el
          : {
              ...el,
              x: refCenterX - el.width / 2,
              y: refCenterY - el.height / 2,
            }
      )
    );

    toast({
      title: 'Выравнивание выполнено',
      description: 'Все элементы выровнены по центру эталона',
    });
  };

  const exportCanvas = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    canvas.width = canvasRef.current.offsetWidth;
    canvas.height = canvasRef.current.offsetHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loaded = 0;
    elements.forEach((el) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
        loaded++;
        if (loaded === elements.length) {
          const link = document.createElement('a');
          link.download = 'aligned-elements.png';
          link.href = canvas.toDataURL();
          link.click();
          toast({
            title: 'Экспорт завершен',
            description: 'Изображение сохранено',
          });
        }
      };
      img.src = el.src;
    });
  };

  const clearCanvas = () => {
    setElements([]);
    toast({
      title: 'Холст очищен',
      description: 'Все элементы удалены',
    });
  };

  const referenceElement = elements.find((el) => el.isReference);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Icon name="Layers" size={36} className="text-primary" />
            Выравниватель элементов
          </h1>
          <p className="text-gray-600">Загрузите элементы и выровняйте их относительно эталона</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 hover-scale">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon name="Target" size={20} className="text-primary" />
              Эталонный элемент
            </h3>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, true)}
                className="hidden"
                disabled={!!referenceElement}
              />
              <Button
                className="w-full"
                variant={referenceElement ? 'secondary' : 'default'}
                disabled={!!referenceElement}
                asChild
              >
                <span className="cursor-pointer">
                  <Icon name="Upload" size={18} className="mr-2" />
                  {referenceElement ? 'Загружен' : 'Загрузить эталон'}
                </span>
              </Button>
            </label>
          </Card>

          <Card className="p-6 hover-scale">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon name="Images" size={20} className="text-primary" />
              Элементы
            </h3>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e, false)}
                className="hidden"
              />
              <Button className="w-full" asChild>
                <span className="cursor-pointer">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить элементы
                </span>
              </Button>
            </label>
          </Card>

          <Card className="p-6 hover-scale">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon name="AlignCenter" size={20} className="text-primary" />
              Выравнивание
            </h3>
            <Button
              className="w-full"
              onClick={alignToReference}
              disabled={!referenceElement || elements.length < 2}
            >
              <Icon name="Move" size={18} className="mr-2" />
              Выровнять все
            </Button>
          </Card>

          <Card className="p-6 hover-scale">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Icon name="Download" size={20} className="text-primary" />
              Экспорт
            </h3>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant="outline"
                onClick={exportCanvas}
                disabled={elements.length === 0}
              >
                <Icon name="Download" size={18} className="mr-2" />
                Сохранить
              </Button>
              <Button
                variant="destructive"
                onClick={clearCanvas}
                disabled={elements.length === 0}
                className="flex-1"
              >
                <Icon name="Trash2" size={18} className="mr-2" />
                Очистить
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-1 bg-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-sm font-medium text-gray-700">Рабочая область</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGuides(!showGuides)}
              className="text-gray-600"
            >
              <Icon name={showGuides ? 'Eye' : 'EyeOff'} size={18} className="mr-2" />
              Направляющие
            </Button>
          </div>

          <div
            ref={canvasRef}
            className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
            style={{ height: '600px' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 animate-fade-in">
                <div className="text-center">
                  <Icon name="MousePointerClick" size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Загрузите изображения для начала работы</p>
                </div>
              </div>
            )}

            {showGuides && referenceElement && (
              <>
                <div
                  className="absolute border-l-2 border-primary/30 pointer-events-none z-10"
                  style={{
                    left: `${referenceElement.x + referenceElement.width / 2}px`,
                    top: 0,
                    height: '100%',
                  }}
                />
                <div
                  className="absolute border-t-2 border-primary/30 pointer-events-none z-10"
                  style={{
                    top: `${referenceElement.y + referenceElement.height / 2}px`,
                    left: 0,
                    width: '100%',
                  }}
                />
              </>
            )}

            {elements.map((el) => (
              <div
                key={el.id}
                draggable
                onDragStart={(e) => handleDragStart(e, el.id)}
                className={`absolute cursor-move transition-all duration-200 hover:scale-105 ${
                  el.isReference ? 'ring-4 ring-primary ring-offset-2 z-20' : 'hover:ring-2 hover:ring-accent'
                }`}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                }}
              >
                <img
                  src={el.src}
                  alt="Element"
                  className="w-full h-full object-contain rounded-lg shadow-md"
                  draggable={false}
                />
                {el.isReference && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    <Icon name="Star" size={12} className="inline mr-1" />
                    Эталон
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
