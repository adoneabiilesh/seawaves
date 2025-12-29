'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Smile, Frown, Meh } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
}

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        onSubmit(rating, comment);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-[#FFFFF0] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-3xl p-6">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-black uppercase">How was your meal?</h2>

                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-8 h-8 cursor-pointer transition-all hover:scale-110 ${rating >= star ? 'fill-[#DC143C] text-[#DC143C]' : 'text-black/20'}`}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>

                    <Textarea
                        placeholder="Tell us what you liked..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-white border-2 border-black rounded-xl min-h-[100px] font-bold placeholder:font-medium"
                    />

                    <Button
                        onClick={handleSubmit}
                        className="w-full bg-black text-white font-black uppercase py-6 text-lg border-2 border-black hover:bg-[#DC143C] hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        Submit Feedback
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
