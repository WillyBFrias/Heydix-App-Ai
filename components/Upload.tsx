import React, {useEffect, useRef, useState} from "react";
import { useOutletContext } from "react-router";
import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from "../lib/constants";



interface UploadProps {
    onComplete: (base64File: string) => Promise<boolean | void> | boolean | void;
    className?: string;
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const readerRef = useRef<FileReader | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>();

    const cleanup = () => {
        if (readerRef.current?.readyState === FileReader.LOADING) {
                readerRef.current.onload = null;
                readerRef.current.onerror = null;
                readerRef.current.abort();
            }
        readerRef.current = null;
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeOutRef.current) clearTimeout(timeOutRef.current);
    };

    useEffect(() => {
        return cleanup;
    }, []);

    const processFile = (file: File) => {
        if (!isSignedIn) return;

        cleanup();
        setFile(file);
        setProgress(0);

        const reader = new FileReader();
        readerRef.current = reader;
        reader.onerror = () => {
            setFile(null);
            setProgress(0);
        };
        reader.onload = () => {
            const base64 = reader.result as string;

            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        timeOutRef.current = setTimeout(async () => {
                            try {
                                const result = await onComplete?.(base64);
                                if (result === false) {
                                    cleanup();
                                    setFile(null);
                                    setProgress(0);
                                }
                            } catch (error) {
                                console.error("Upload failed:", error);
                                cleanup();
                                setFile(null);
                                setProgress(0);
                            }
                        }, REDIRECT_DELAY_MS);
                        return 100;
                    }
                    return prev + PROGRESS_STEP;
                });
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (droppedFile && (allowedTypes.includes(droppedFile.type) || droppedFile.name.toLowerCase().endsWith('.webp'))) {
            processFile(droppedFile);
        }
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFile = e.target.files?.[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (selectedFile && (allowedTypes.includes(selectedFile.type) || selectedFile.name.toLowerCase().endsWith('.webp'))) {
            processFile(selectedFile);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? "is-dragging" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png,.webp"
                        disabled={!isSignedIn}
                        onChange={handleOnChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>

                        <p>
                            {isSignedIn
                                ? "Click to upload or just drag and drop"
                                : "Sign in or sign up with Puter to upload"}
                        </p>

                        <p className="help">Maximum file size 50 MB.</p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image" />
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className="progress">
                            <div className="bar" style={{ width: `${progress}%` }} />

                            <p className="status-text">
                                {progress < 100
                                    ? "Analyzing Floor Plan..."
                                    : "Redirecting..."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;