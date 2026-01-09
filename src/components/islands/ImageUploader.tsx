import { useState, useCallback, useRef } from 'react';

interface ImageUploaderProps {
    initialImages?: string[];
    inputName?: string;
}

export default function ImageUploader({
    initialImages = [],
    inputName = 'images'
}: ImageUploaderProps) {
    const [images, setImages] = useState<string[]>(initialImages);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadImage = async (file: File): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Upload error:', result.error);
                setError(`Error: ${result.error || 'No se pudo subir la imagen'}`);
                return null;
            }

            return result.url;
        } catch (err) {
            console.error('Upload fetch error:', err);
            setError('Error de conexión al subir la imagen');
            return null;
        }
    };

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);

        const validFiles = Array.from(files).filter(file =>
            file.type.startsWith('image/')
        );

        if (validFiles.length === 0) {
            setError('Por favor, selecciona archivos de imagen válidos');
            setUploading(false);
            return;
        }

        try {
            const uploadPromises = validFiles.map(uploadImage);
            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter((url): url is string => url !== null);

            if (successfulUploads.length < validFiles.length) {
                setError(`${validFiles.length - successfulUploads.length} imagen(es) no se pudieron subir`);
            }

            setImages(prev => [...prev, ...successfulUploads]);
        } catch (err) {
            setError('Error al subir las imágenes');
            console.error(err);
        } finally {
            setUploading(false);
        }
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            {/* Hidden input for form submission */}
            <input
                type="hidden"
                name={inputName}
                value={images.join('\n')}
            />

            {/* Upload zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={openFileDialog}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                />

                <div className="space-y-2">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    {uploading ? (
                        <p className="text-gray-600">Subiendo imágenes...</p>
                    ) : (
                        <>
                            <p className="text-gray-600">
                                <span className="font-semibold text-blue-600">
                                    Haz clic para subir
                                </span>
                                {' '}o arrastra las imágenes aquí
                            </p>
                            <p className="text-sm text-gray-500">
                                PNG, JPG, WEBP hasta 10MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {error}
                </p>
            )}

            {/* Image previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div
                            key={url}
                            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
                        >
                            <img
                                src={url}
                                alt={`Imagen ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full 
                                         opacity-0 group-hover:opacity-100 transition-opacity
                                         hover:bg-red-600"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    Principal
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
