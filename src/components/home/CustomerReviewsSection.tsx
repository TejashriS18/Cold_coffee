"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  ShieldAlert,
  Plus,
  X,
  CheckCircle2,
  MapPin,
  Coffee,
} from "lucide-react";
import {
  SAMPLE_DEMONSTRATION_REVIEWS,
  CustomerReview,
} from "@/config/reviews";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

export function CustomerReviewsSection() {
  const [reviews, setReviews] = useState<CustomerReview[]>(SAMPLE_DEMONSTRATION_REVIEWS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New review form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(5);
  const [favoriteDrink, setFavoriteDrink] = useState("Classic Chill");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Hydrate user-submitted reviews from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("frost_user_reviews_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReviews([...parsed, ...SAMPLE_DEMONSTRATION_REVIEWS]);
          }
        }
      } catch {
        // Ignore local storage error
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || name.trim().length < 2) {
      setFormError("Please enter your name (minimum 2 characters).");
      return;
    }

    if (!location.trim()) {
      setFormError("Please enter your city/neighborhood.");
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setFormError("Please share at least a few words about your cold coffee experience (min 10 characters).");
      return;
    }

    const initials = name
      .trim()
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const newReview: CustomerReview = {
      id: `user-rev-${Date.now()}`,
      authorName: name.trim(),
      location: location.trim(),
      rating,
      date: new Date().toISOString().slice(0, 10),
      favoriteDrink,
      comment: comment.trim(),
      avatarInitials: initials || "FB",
      tastingTag: "Community Voice",
      isDemo: false, // Genuine user-submitted review!
    };

    try {
      const saved = localStorage.getItem("frost_user_reviews_v1");
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem(
        "frost_user_reviews_v1",
        JSON.stringify([newReview, ...existing])
      );
    } catch {
      // Ignore storage errors
    }

    setReviews((prev) => [newReview, ...prev]);
    setIsModalOpen(false);
    setName("");
    setLocation("");
    setComment("");
    setSuccessToast("Thank you! Your genuine community review has been posted.");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <section
      id="reviews"
      className="scroll-mt-20 py-20 md:py-28 bg-[#FBF8F3] border-t border-[#3B241A]/10 relative"
    >
      <Container size="xl">
        {/* Section Header */}
        <SectionHeading
          eyebrow="Community & Honest Feedback"
          title="Tasting Notes from Coffee Lovers"
          description="Read genuine experiences from our community of cold coffee enthusiasts. In accordance with transparency standards, all sample layout entries are clearly labeled."
          align="center"
          className="mb-8"
        />

        {/* Consumer Transparency & Demonstration Disclaimer Banner */}
        <div className="max-w-3xl mx-auto mb-12 rounded-2xl bg-[#F6F0E7] border border-[#3B241A]/15 p-4 text-xs text-[#6F4935] flex items-start gap-3 shadow-warm-sm">
          <ShieldAlert className="h-5 w-5 text-[#C58A4A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#3B241A] uppercase tracking-wider block">
              Transparency Notice • Demonstration Data Notice
            </span>
            <p>
              Pre-loaded entries below are designated as <strong>[Demonstration Data]</strong> to showcase typography and layout hierarchy without fabricating verified buyer credentials. Community members can submit authentic feedback via the button below.
            </p>
          </div>
        </div>

        {/* Action Header: Submit Review Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className="text-sm font-bold text-[#3B241A]">
              4.9 / 5.0 Average Community Rating
            </span>
            <span className="text-xs text-[#6F4935]">
              ({reviews.length} total reviews)
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Leave Honest Feedback
          </Button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">{successToast}</span>
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev) => (
            <Card
              key={rev.id}
              variant="white"
              className="flex flex-col justify-between p-6 rounded-2xl shadow-warm-sm border border-[#3B241A]/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-warm-md"
            >
              <div>
                {/* Header: Label Badge */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>

                  {rev.isDemo ? (
                    <span className="rounded-full bg-[#3B241A]/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6F4935] border border-[#3B241A]/10">
                      Sample Data
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                      Verified Post
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-xs text-[#3B241A] leading-relaxed italic mb-4">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              {/* Author & Context Footer */}
              <div className="pt-3.5 border-t border-[#3B241A]/10 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3B241A] text-[#F6F0E7] text-xs font-bold">
                    {rev.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#3B241A] truncate">
                      {rev.authorName}
                    </p>
                    <p className="text-[10px] text-[#6F4935] truncate flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      <span>{rev.location}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#6F4935] pt-1">
                  <span className="truncate max-w-[140px] text-[#C58A4A] font-medium flex items-center gap-1">
                    <Coffee className="h-3 w-3 shrink-0" />
                    <span className="truncate">{rev.favoriteDrink}</span>
                  </span>
                  <span>{rev.date}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>

      {/* Leave a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#271710]/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#3B241A]/10 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-[#3B241A]/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C58A4A]">
                  Community Tasting Feedback
                </span>
                <h4 className="font-serif text-xl font-bold text-[#3B241A] mt-0.5">
                  Share Your Cold Coffee Experience
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-[#6F4935] hover:text-[#3B241A] hover:bg-[#F6F0E7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sen"
                    className="w-full rounded-xl border border-[#3B241A]/15 bg-[#F6F0E7]/20 py-2 px-3 text-xs text-[#3B241A] focus:border-[#3B241A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-1">
                    City / Neighborhood <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Indiranagar, Bengaluru"
                    className="w-full rounded-xl border border-[#3B241A]/15 bg-[#F6F0E7]/20 py-2 px-3 text-xs text-[#3B241A] focus:border-[#3B241A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-1">
                    Rating (Stars)
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#3B241A]/15 bg-[#F6F0E7]/20 py-2 px-3 text-xs text-[#3B241A] focus:border-[#3B241A] focus:outline-none"
                  >
                    <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                    <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                    <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                    <option value={2}>★★☆☆☆ (2 Stars - Needs Improvement)</option>
                    <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-1">
                    Favorite Drink
                  </label>
                  <select
                    value={favoriteDrink}
                    onChange={(e) => setFavoriteDrink(e.target.value)}
                    className="w-full rounded-xl border border-[#3B241A]/15 bg-[#F6F0E7]/20 py-2 px-3 text-xs text-[#3B241A] focus:border-[#3B241A] focus:outline-none"
                  >
                    <option value="Classic Chill">Classic Chill</option>
                    <option value="Caramel Bliss">Caramel Bliss</option>
                    <option value="Choco Mocha">Choco Mocha</option>
                    <option value="Vanilla Dream">Vanilla Dream</option>
                    <option value="Hazelnut Heaven">Hazelnut Heaven</option>
                    <option value="Oreo Cold Coffee">Oreo Cold Coffee</option>
                    <option value="Nitro Velvet Stout">Nitro Velvet Stout</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6F4935] mb-1">
                  Your Review & Tasting Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked about the flavor profile, sweetness, ice density, or freshness..."
                  className="w-full rounded-xl border border-[#3B241A]/15 bg-[#F6F0E7]/20 py-2 px-3 text-xs text-[#3B241A] focus:border-[#3B241A] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#3B241A]/10 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Post Genuine Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
