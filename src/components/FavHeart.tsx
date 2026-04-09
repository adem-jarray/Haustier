// Unified heart button — same design everywhere
import { Heart } from "lucide-react";

interface FavHeartProps {
  isFav: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

const FavHeart = ({ isFav, onClick, className = "" }: FavHeartProps) => (
  <button
    className={`w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors ${className}`}
    onClick={onClick}
  >
    <Heart
      className={`h-5 w-5 transition-all duration-300 ${
        isFav ? "fill-destructive text-destructive scale-110" : "text-destructive"
      }`}
    />
  </button>
);

export default FavHeart;
