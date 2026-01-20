"use client";

import { Clock, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";
export function CourseStats({ duration, lessonsCount, rating, className = "" }) {
  return (
    <div className={cn("flex items-center gap-4 text-sm text-gray-500", className)}>
      {duration && (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{duration}</span>
        </div>
      )}
      {lessonsCount !== undefined && (
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{lessonsCount} lessons</span>
        </div>
      )}
      {/* {rating !== undefined && (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span>{rating}</span>
        </div>
      )} */}
    </div>
  );
}

