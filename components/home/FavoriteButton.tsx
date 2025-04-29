"use client";

import React, { useState } from "react";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useFavorites } from "@/utils/FavoritesContext";
import { useAuth } from "@/utils/AuthContext";
import { useGuestUser } from "@/utils/GuestUserContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Enhanced modal component for guest users
const AuthRequiredModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  const router = useRouter();

  if (!isVisible) return null;

  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="bg-accent text-white p-8 rounded-xl max-w-md mx-4 shadow-lg"
      >
        <div className="flex flex-col items-center text-center">
          <LockClosedIcon className="h-16 w-16 mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            You're browsing as a guest
          </h2>
          <p className="mb-6">
            Please sign in to access and manage your favorites.
          </p>
          <button
            onClick={handleSignIn}
            className="bg-white text-accent font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-white/80 hover:text-white"
          >
            Return to Home
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface FavoriteButtonProps {
  carId: number;
  initialLikes?: number;
  onLikesUpdate?: (newLikes: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCount?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  carId,
  initialLikes = 0,
  onLikesUpdate,
  size = "md",
  className = "",
  showCount = false,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isSignedIn } = useAuth();
  const { isGuest } = useGuestUser();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);

  // Determine whether the car is favorited
  const favorited = isFavorite(carId);

  // Size mappings
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-8 w-8",
  };

  // Button container size mappings
  const containerSizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Show modal if the user is not signed in OR is in guest mode
    if (!isSignedIn || isGuest) {
      setIsModalVisible(true);
      return;
    }

    try {
      setIsLoading(true);
      const newLikesCount = await toggleFavorite(carId);
      setLikesCount(newLikesCount);

      // Call the callback if provided
      if (onLikesUpdate) {
        onLikesUpdate(newLikesCount);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleFavoriteToggle}
        disabled={isLoading}
        className={`${
          containerSizeClasses[size]
        } rounded-full transition-all focus:outline-none relative group ${
          favorited
            ? "bg-accent/10 hover:bg-accent/20 text-accent"
            : "bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white hover:text-accent"
        } ${className}`}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full border-t-2 border-b-2 border-current h-4 w-4 m-auto"></div>
        ) : favorited ? (
          <HeartSolid className={sizeClasses[size]} />
        ) : (
          <HeartOutline className={sizeClasses[size]} />
        )}

        {showCount && likesCount > 0 && (
          <span className="ml-1 text-sm font-medium">{likesCount}</span>
        )}

        {/* Tooltip */}
        <span className="absolute top-full left-1/2 -ml-20 mt-2 px-2 py-1 bg-gray-800/70 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {favorited ? "Remove favorite" : "Add to favorites"}
        </span>
      </button>

      <AuthRequiredModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </>
  );
};

export default FavoriteButton;
