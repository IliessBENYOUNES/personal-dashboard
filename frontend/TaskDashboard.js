  import React, { useState, useEffect } from 'react';
import { Bell, Clock, Play, Pause, Plus, Save, Trash, Edit, CheckCircle } from 'lucide-react';
import TaskItem from './TaskItem';
import DashboardStats from './DashboardStats';
import PomodoroTimer from './PomodoroTimer';
import { formatTime } from '../utils/formatTime';

const TaskDashboard = () => {
  // États pour gérer les données de l'application
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [activeTask, setActiveTask] = useState(null);
  const [activeTaskObject, setActiveTaskObject] = useState(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [showBreakNotification, setShowBreakNotification] = useState(false);
  const [breakInterval, setBreakInterval] = useState(60); // 60 minutes par défaut
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // État pour gérer l'affichage ou non du Pomodoro
  const [showPomodoro, setShowPomodoro] = useState(true);

  // Sauvegarde des tâches dans le localStorage
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);
  
  // Mise à jour de l'objet de tâche active quand l'ID change
  useEffect(() => {
    if (activeTask) {
      const task = tasks.find(t => t.id === activeTask);
      setActiveTaskObject(task);
    } else {
      setActiveTaskObject(null);
    }
  }, [activeTask, tasks]);

  // Fonction pour ajouter une nouvelle tâche
  const addTask = () => {
    if (newTaskName.trim() === '') return;
    
    const newTask = {
      id: Date.now(),
      name: newTaskName,
      time: 0,
      active: false,
      lastStarted: null,
      completed: false
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskName('');
  };

  // Fonction pour démarrer/arrêter le chronométrage d'une tâche
  const toggleTaskTimer = (id) => {
    // Si une tâche est déjà active, on l'arrête
    if (activeTask && activeTask !== id) {
      stopTaskTimer(activeTask);
    }
    
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        if (!task.active) {
          // Démarrer le chronomètre
          return {
            ...task,
            active: true,
            lastStarted: Date.now()
          };
        } else {
          // Arrêter le chronomètre et mettre à jour le temps
          const elapsedSeconds = Math.floor((Date.now() - task.lastStarted) / 1000);
          return {
            ...task,
            active: false,
            time: task.time + elapsedSeconds,
            lastStarted: null
          };
        }
      }
      return task;
    });
    
    setTasks(updatedTasks);
    setActiveTask(activeTask === id ? null : id);
  };

  // Fonction pour arrêter explicitement une tâche active
  const stopTaskTimer = (id) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id && task.active) {
        const elapsedSeconds = Math.floor((Date.now() - task.lastStarted) / 1000);
        return {
          ...task,
          active: false,
          time: task.time + elapsedSeconds,
          lastStarted: null
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    setActiveTask(null);
  };

  // Mise à jour régulière du temps pour la tâche active
  useEffect(() => {
    if (!activeTask) return;
    
    const intervalId = setInterval(() => {
      setTasks(currentTasks => {
        return currentTasks.map(task => {
          if (task.id === activeTask && task.active) {
            const elapsedSeconds = Math.floor((Date.now() - task.lastStarted) / 1000);
            
            // Vérification pour pause après le temps défini
            if (elapsedSeconds >= breakInterval * 60 && !showBreakNotification) {
              setShowBreakNotification(true);
              // Notification du navigateur si supportée
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Temps de pause', {
                  body: `Vous travaillez sur "${task.name}" depuis ${breakInterval} minutes. Prenez une pause!`
                });
              }
            }
            
            return {
              ...task,
              time: task.time + 1
            };
          }
          return task;
        });
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [activeTask, breakInterval, showBreakNotification]);

  // Demande de permission pour les notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Fonction pour supprimer une tâche
  const deleteTask = (id) => {
    if (activeTask === id) {
      stopTaskTimer(id);
    }
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Fonction pour marquer une tâche comme terminée
  const toggleTaskCompletion = (id) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        if (task.active) {
          stopTaskTimer(id);
        }
        return {
          ...task,
          completed: !task.completed
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
  };

  // Fonction pour éditer le nom d'une tâche
  const startEditingTask = (task) => {
    setEditingTask(task.id);
    setEditTaskName(task.name);
  };

  const saveTaskEdit = () => {
    if (editTaskName.trim() === '') return;
    
    const updatedTasks = tasks.map(task => {
      if (task.id === editingTask) {
        return {
          ...task,
          name: editTaskName
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    setEditingTask(null);
  };
  
  // Fonctions pour le Pomodoro
  const handleBreakStart = () => {
    // Si une tâche est active, nous pouvons la mettre en pause pendant la pause Pomodoro
    if (activeTask) {
      stopTaskTimer(activeTask);
    }
    setShowBreakNotification(true);
  };
  
  const handleWorkStart = () => {
    // Fermer toute notification de pause
    setShowBreakNotification(false);
  };

  // Calcul des statistiques pour le tableau de bord
  const totalTimeSpent = tasks.reduce((total, task) => {
    const activeTime = task.active ? Math.floor((Date.now() - task.lastStarted) / 1000) : 0;
    return total + task.time + activeTime;
  }, 0);
  
  const completedTasks = tasks.filter(task => task.completed).length;
  const activeTasks = tasks.filter(task => !task.completed).length;

  // Triage des tâches : actives en premier, puis par nom
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 bg-gray-50">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tableau de Bord Personnel</h1>
        <p className="text-gray-600">Gestion des tâches quotidiennes</p>
      </header>

      {/* Tableau de bord avec statistiques */}
      <DashboardStats 
        totalTimeSpent={totalTimeSpent}
        activeTasks={activeTasks}
        completedTasks={completedTasks}
      />
      
      {/* Pomodoro Timer */}
      {showPomodoro && (
        <div className="relative">
          <button 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPomodoro(false)}
          >
            ✕
          </button>
          <PomodoroTimer 
            onBreakStart={handleBreakStart}
            onWorkStart={handleWorkStart}
            activeTask={activeTaskObject}
          />
        </div>
      )}
      
      {!showPomodoro && (
        <button
          className="bg-white p-2 mb-6 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
          onClick={() => setShowPomodoro(true)}
        >
          Afficher le minuteur Pomodoro
        </button>
      )}

      {/* Formulaire d'ajout de tâche */}
      <div className="flex mb-6">
        <input
          type="text"
          className="flex-grow p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nouvelle tâche..."
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <button
          className="bg-blue-500 text-white p-2 rounded-r flex items-center"
          onClick={addTask}
        >
          <Plus size={20} />
          <span className="ml-1">Ajouter</span>
        </button>
      </div>

      {/* Liste des tâches */}
      <div className="flex-grow overflow-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Mes Tâches</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙️ Paramètres
            </button>
          </div>

          {showSettings && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-md font-medium mb-2">Intervalle de pause</h3>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  className="w-16 p-2 border border-gray-300 rounded mr-2"
                  value={breakInterval}
                  onChange={(e) => setBreakInterval(parseInt(e.target.value) || 60)}
                />
                <span className="text-gray-600">minutes</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Vous recevrez une notification après ce temps de travail continu.
              </p>
            </div>
          )}

          {showBreakNotification && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex justify-between items-center">
              <div className="flex items-center">
                <Bell className="text-yellow-500 mr-2" size={20} />
                <span>Il est temps de prendre une pause !</span>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowBreakNotification(false)}
              >
                ✕
              </button>
            </div>
          )}

          <ul className="divide-y divide-gray-200">
            {sortedTasks.length > 0 ? (
              sortedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isEditing={editingTask === task.id}
                  editTaskName={editingTask === task.id ? editTaskName : ''}
                  onEditChange={(e) => setEditTaskName(e.target.value)}
                  onSaveEdit={saveTaskEdit}
                  onStartEdit={() => startEditingTask(task)}
                  onToggleCompletion={() => toggleTaskCompletion(task.id)}
                  onToggleTimer={() => toggleTaskTimer(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))
            ) : (
              <li className="p-8 text-center text-gray-500">
                Aucune tâche. Ajoutez-en une pour commencer !
              </li>
            )}
          </ul>
        </div>
      </div>

      <footer className="mt-6 text-center text-sm text-gray-500">
        <p>Tableau de Bord Personnel © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default TaskDashboard;
