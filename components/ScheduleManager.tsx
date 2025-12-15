'use client';

import React, { useState } from 'react';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

export interface ScheduleDay {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breaks?: Array<{ start: string; end: string }>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ScheduleManagerProps {
  schedule: ScheduleDay[];
  onUpdate: (schedule: ScheduleDay[]) => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({ schedule, onUpdate }) => {
  const [localSchedule, setLocalSchedule] = useState<ScheduleDay[]>(
    schedule.length > 0 ? schedule : DAYS.map(day => ({
      day,
      isOpen: true,
      openTime: '09:00',
      closeTime: '22:00',
      breaks: [],
    }))
  );

  const updateDay = (dayIndex: number, updates: Partial<ScheduleDay>) => {
    const updated = [...localSchedule];
    updated[dayIndex] = { ...updated[dayIndex], ...updates };
    setLocalSchedule(updated);
  };

  const toggleDay = (dayIndex: number) => {
    updateDay(dayIndex, { isOpen: !localSchedule[dayIndex].isOpen });
  };

  const addBreak = (dayIndex: number) => {
    const updated = [...localSchedule];
    updated[dayIndex].breaks = [
      ...(updated[dayIndex].breaks || []),
      { start: '14:00', end: '15:00' },
    ];
    setLocalSchedule(updated);
  };

  const removeBreak = (dayIndex: number, breakIndex: number) => {
    const updated = [...localSchedule];
    updated[dayIndex].breaks = updated[dayIndex].breaks?.filter((_, i) => i !== breakIndex) || [];
    setLocalSchedule(updated);
  };

  const updateBreak = (dayIndex: number, breakIndex: number, field: 'start' | 'end', value: string) => {
    const updated = [...localSchedule];
    if (updated[dayIndex].breaks) {
      updated[dayIndex].breaks[breakIndex] = {
        ...updated[dayIndex].breaks[breakIndex],
        [field]: value,
      };
    }
    setLocalSchedule(updated);
  };

  const handleSave = () => {
    onUpdate(localSchedule);
  };

  return (
    <Card className="border border-[#111111]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" /> Working Hours Schedule
        </CardTitle>
        <CardDescription>Set your restaurant's operating hours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {localSchedule.map((day, dayIndex) => (
            <div
              key={day.day}
              className="border border-[#111111] rounded-md p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={() => toggleDay(dayIndex)}
                    className="w-4 h-4 border-[#111111] rounded"
                  />
                  <label className="font-semibold text-[#111111]">{day.day}</label>
                </div>
                {day.isOpen && (
                  <span className="text-xs text-[#111111]/50">Open</span>
                )}
              </div>

              {day.isOpen && (
                <div className="grid grid-cols-2 gap-3 pl-7">
                  <div>
                    <label className="text-xs text-[#111111]/70 mb-1 block">Open Time</label>
                    <Input
                      type="time"
                      value={day.openTime}
                      onChange={(e) => updateDay(dayIndex, { openTime: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#111111]/70 mb-1 block">Close Time</label>
                    <Input
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => updateDay(dayIndex, { closeTime: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-[#111111]/70">Breaks</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addBreak(dayIndex)}
                        className="text-xs h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Break
                      </Button>
                    </div>
                    {day.breaks?.map((breakTime, breakIndex) => (
                      <div key={breakIndex} className="flex gap-2 items-center">
                        <Input
                          type="time"
                          value={breakTime.start}
                          onChange={(e) => updateBreak(dayIndex, breakIndex, 'start', e.target.value)}
                          className="text-xs flex-1"
                        />
                        <span className="text-[#111111]/50">-</span>
                        <Input
                          type="time"
                          value={breakTime.end}
                          onChange={(e) => updateBreak(dayIndex, breakIndex, 'end', e.target.value)}
                          className="text-xs flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBreak(dayIndex, breakIndex)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-[#111111]">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};





