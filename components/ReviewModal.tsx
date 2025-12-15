import React, { useState } from 'react';
import { Star, X, Send } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  restaurantId: string;
  items: Array<{ id: string; name: { en: string }; quantity: number }>;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  restaurantId,
  items,
  onReviewSubmitted,
}) => {
  const [orderRating, setOrderRating] = useState(0);
  const [orderComment, setOrderComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleItemRating = (itemId: string, rating: number) => {
    setItemRatings((prev) => ({ ...prev, [itemId]: rating }));
  };

  const handleSubmit = async () => {
    if (orderRating === 0) {
      alert('Please rate your order');
      return;
    }

    setSubmitting(true);

    try {
      // Submit order review
      await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          orderId,
          rating: orderRating,
          comment: orderComment,
          customerName: customerName || undefined,
        }),
      });

      // Submit individual item ratings
      const ratingPromises = Object.entries(itemRatings).map(([itemId, rating]) =>
        fetch('/api/ratings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menuItemId: itemId,
            orderId,
            rating,
          }),
        })
      );

      await Promise.all(ratingPromises);

      onReviewSubmitted();
      onClose();
      
      // Reset form
      setOrderRating(0);
      setOrderComment('');
      setCustomerName('');
      setItemRatings({});
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-white rounded-3xl w-full max-w-2xl z-10 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Rate Your Experience</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Order Overall Rating */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How was your overall experience?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setOrderRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={
                      star <= orderRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Individual Item Ratings */}
          {items.length > 0 && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate individual items
              </label>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {item.name.en} (x{item.quantity})
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleItemRating(item.id, star)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              size={20}
                              className={
                                star <= (itemRatings[item.id] || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your thoughts (optional)
            </label>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              rows={4}
              placeholder="Tell us about your experience..."
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
            />
          </div>

          {/* Customer Name (optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your name (optional)
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              placeholder="John Doe"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={submitting || orderRating === 0}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-bold shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                Submit Review <Send size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};





