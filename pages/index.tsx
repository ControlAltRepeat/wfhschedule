import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateSchedule = (
  people: string[],
  workDays: string[],
  weeks: number,
  daysAtWork: number,
  minOfficeAttendance: number
): { 
  schedule: Record<string, { atWork: string[], workingFromHome: string[] }>,
  workDaysCount: Record<string, { atWork: number, workingFromHome: number }>,
  minimumMet: boolean 
} => {
  const schedule: Record<string, { atWork: string[], workingFromHome: string[] }> = {};
  const workDaysCount: Record<string, { atWork: number, workingFromHome: number }> = {};
  people.forEach(person => workDaysCount[person] = { atWork: 0, workingFromHome: 0 });

  const totalWorkDays = weeks * workDays.length;
  const targetDaysAtWork = totalWorkDays * (daysAtWork / 5);
  const targetDaysWFH = totalWorkDays * ((5 - daysAtWork) / 5);

  let minimumMet = true;

  // Initialize all days
  for (let week = 0; week < weeks; week++) {
    workDays.forEach(day => {
      const dayKey = `${week}-${day}`;
      schedule[dayKey] = { atWork: [], workingFromHome: [] };
    });
  }

  // Assign At Work days first
  people.forEach(person => {
    let daysAssigned = 0;
    while (daysAssigned < targetDaysAtWork) {
      const weekIndex = Math.floor(Math.random() * weeks);
      const dayIndex = Math.floor(Math.random() * workDays.length);
      const dayKey = `${weekIndex}-${workDays[dayIndex]}`;
      if (!schedule[dayKey].atWork.includes(person)) {
        schedule[dayKey].atWork.push(person);
        workDaysCount[person].atWork++;
        daysAssigned++;
      }
    }
  });

  // Assign WFH days
  people.forEach(person => {
    let daysAssigned = 0;
    while (daysAssigned < targetDaysWFH) {
      const weekIndex = Math.floor(Math.random() * weeks);
      const dayIndex = Math.floor(Math.random() * workDays.length);
      const dayKey = `${weekIndex}-${workDays[dayIndex]}`;
      if (!schedule[dayKey].atWork.includes(person) && !schedule[dayKey].workingFromHome.includes(person)) {
        schedule[dayKey].workingFromHome.push(person);
        workDaysCount[person].workingFromHome++;
        daysAssigned++;
      }
    }
  });

  // Check if minimum office attendance is met
  Object.values(schedule).forEach(day => {
    if (day.atWork.length < minOfficeAttendance) {
      minimumMet = false;
    }
  });

  return { schedule, workDaysCount, minimumMet };
};

const RotatingSchedule: React.FC = () => {
  const [people, setPeople] = useState<string[]>(['', '', '']);
  const [workDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [weeks, setWeeks] = useState<number>(1);
  const [daysAtWork, setDaysAtWork] = useState<number>(3);
  const [minOfficeAttendance, setMinOfficeAttendance] = useState<number>(1);
  const [schedule, setSchedule] = useState<Record<string, { atWork: string[], workingFromHome: string[] }>>({});
  const [workDaysCount, setWorkDaysCount] = useState<Record<string, { atWork: number, workingFromHome: number }>>({});
  const [minimumMet, setMinimumMet] = useState<boolean>(true);

  const generateNewSchedule = useCallback(() => {
    const validPeople = people.filter(person => person.trim() !== '');
    if (validPeople.length > 0) {
      const { schedule: newSchedule, workDaysCount: newWorkDaysCount, minimumMet: newMinimumMet } = 
        generateSchedule(validPeople, workDays, weeks, daysAtWork, minOfficeAttendance);
      setSchedule(newSchedule);
      setWorkDaysCount(newWorkDaysCount);
      setMinimumMet(newMinimumMet);
    } else {
      setSchedule({});
      setWorkDaysCount({});
      setMinimumMet(true);
    }
  }, [people, workDays, weeks, daysAtWork, minOfficeAttendance]);

  useEffect(() => {
    generateNewSchedule();
  }, [generateNewSchedule]);

  const handleNameChange = (index: number, name: string) => {
    const newPeople = [...people];
    newPeople[index] = name;
    setPeople(newPeople);
  };

  const handleAddPerson = () => {
    setPeople([...people, '']);
  };

  const handleRemovePerson = (index: number) => {
    const newPeople = people.filter((_, i) => i !== index);
    setPeople(newPeople);
    setMinOfficeAttendance(prev => Math.min(prev, newPeople.length));
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Precise Work-Home Balance Schedule</h1>
      
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weeks">Number of Weeks</Label>
          <Input
            id="weeks"
            type="number"
            value={weeks}
            onChange={(e) => setWeeks(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor="minOfficeAttendance">Minimum Office Attendance</Label>
          <Input
            id="minOfficeAttendance"
            type="number"
            value={minOfficeAttendance}
            onChange={(e) => setMinOfficeAttendance(Math.max(1, Math.min(people.length, parseInt(e.target.value) || 1)))}
            min="1"
            max={people.length}
            className="w-full"
          />
        </div>
      </div>

      <div className="mb-4">
        <Label>Work-Home Balance (Days per Week)</Label>
        <div className="flex items-center">
          <span className="mr-2">WFH: {5 - daysAtWork}</span>
          <Slider
            value={[daysAtWork]}
            onValueChange={(value) => setDaysAtWork(value[0])}
            max={5}
            step={1}
            className="flex-grow mx-4"
          />
          <span className="ml-2">At Work: {daysAtWork}</span>
        </div>
      </div>

      {!minimumMet && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            The minimum office attendance requirement is not met for all days. Please adjust your parameters.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Enter Names</h2>
        {people.map((person, index) => (
          <div key={index} className="flex items-center mb-2">
            <Input
              type="text"
              value={person}
              onChange={(e) => handleNameChange(index, e.target.value)}
              placeholder={`Name of Person ${index + 1}`}
              className="w-full mr-2"
            />
            <Button onClick={() => handleRemovePerson(index)}>Remove</Button>
          </div>
        ))}
        <Button onClick={handleAddPerson}>Add Person</Button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Schedule</h2>
        <div className="border">
          <div className="grid grid-cols-5 gap-1 bg-gray-100 font-bold text-center">
            {workDays.map(day => (
              <div key={day} className="p-2 border">{day}</div>
            ))}
          </div>
          {[...Array(weeks)].map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-5 gap-1 border-t">
              {workDays.map(day => {
                const dayKey = `${weekIndex}-${day}`;
                const scheduleForDay = schedule[dayKey] || { atWork: [], workingFromHome: [] };
                return (
                  <div key={dayKey} className="p-2 border-r min-h-[100px]">
                    <div className="text-xs">
                      <div className="font-semibold">At Work:</div>
                      {scheduleForDay.atWork.map(person => (
                        <div key={person}>{person}</div>
                      ))}
                      <div className="font-semibold mt-1">WFH:</div>
                      {scheduleForDay.workingFromHome.map(person => (
                        <div key={person}>{person}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Work Days Summary</h2>
        {Object.entries(workDaysCount).map(([person, counts]) => (
          <div key={person}>
            {person}: At Work: {counts.atWork}, WFH: {counts.workingFromHome}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RotatingSchedule;