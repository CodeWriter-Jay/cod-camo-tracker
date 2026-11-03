import { useState } from "react";
import { imageUrl } from "../data/catalog";

interface CamoImageProps {
  file: string | null;
  className?: string;
}

/** 无图片或加载失败时显示占位块，避免出现破图 */
export function CamoImage({ file, className = "thumb" }: CamoImageProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (!file || hasFailed) return <span className={`${className} is-placeholder`} aria-hidden />;

  return (
    <img
      className={className}
      src={imageUrl(file)}
      alt=""
      loading="lazy"
      onError={() => setHasFailed(true)}
    />
  );
}
