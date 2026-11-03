import { useState } from "react";
import { useImages } from "../hooks/useImageLibrary";

interface CamoImageProps {
  file: string | null;
  className?: string;
}

/** 无图片或加载失败（如断网时的在线图片）时显示占位块，避免出现破图 */
export function CamoImage({ file, className = "thumb" }: CamoImageProps) {
  const { resolve } = useImages();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = file ? resolve(file) : null;

  if (!src || src === failedSrc)
    return <span className={`${className} is-placeholder`} aria-hidden />;

  return (
    <img className={className} src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} />
  );
}
