import React from 'react';
import { Play, Pause, Save, Trash, Edit } from 'lucide-react';
import { formatTime } from '../utils/formatTime';

const TaskItem = ({
  task,
  isEditing,
  editTaskName,
  onEditChange,
  onSaveEdit,
  onStartEdit,
  onToggleCompletion,
  onToggleTimer,
  onDelete
}) => {
  // Calcul du temps total incluant le temps actif si la tâche est en cours
  const totalTime = task.time + (task.active 
    ? Math.floor((Date.now() - task.lastStarted) / 1000) 
    : 0);

  return (
    <li className={`p-4 flex items-center justify-between ${task.completed ? 'bg-gray-50' : ''}`}>
      <div className="flex items-center flex-grow mr-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggleCompletion}
          className="mr-3 h-5 w-5 rounded border-gray-300"
        />
        
        {isEditing ? (
          <input
            type="text"
            className="flex-grow p-1 border border-gray-300 rounded"
            value={editTaskName}
            onChange={onEditChange}
            onKeyPress={(e) => e.key === 'Enter' && onSaveEdit()}
            autoFocus
          />
        ) : (
          <span className={`flex-grow ${task.completed ? 'line-through text-gray-500' : ''}`}>
