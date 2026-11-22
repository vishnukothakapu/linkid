"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from "react-image-crop";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
    return centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, 1, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    );
}

async function getCroppedBlob(
    image: HTMLImageElement,
    crop: PixelCrop
): Promise<Blob> {
    const canvas = document.createElement("canvas");
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        size,
        size
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas is empty"));
            },
            "image/jpeg",
            0.9
        );
    });
}

export function AvatarCropModal({
    open,
    imageSrc,
    onClose,
    onCropComplete,
}: {
    open: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (blob: Blob) => void;
}) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height));
    }, []);

    async function handleSave() {
        if (!imgRef.current || !completedCrop) return;
        const blob = await getCroppedBlob(imgRef.current, completedCrop);
        onCropComplete(blob);
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crop your photo</DialogTitle>
                </DialogHeader>

                <div className="flex justify-center">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            onLoad={onImageLoad}
                            className="max-h-96 max-w-full"
                            alt="Crop preview"
                        />
                    </ReactCrop>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}