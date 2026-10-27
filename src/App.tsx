import React, { useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import './App.css';
import SettingsBar from './SettingsBar';
import Editor, { IEditor, Tasks } from './Editor';
import Help from './Help';
import Visualization, { IVisualization } from './Visualization';
import { useSettingsStore } from './storage';
import Settings from './Settings';
import Canvas from './Canvas';
import { useCanvasStore } from './canvasStorage';

function App() {
  const [location] = useLocation();
  const [tasks, setTasks] = useState<Tasks[]>([]);

  const state = useSettingsStore();
  useEffect(() => {
    document.documentElement.setAttribute('saved-theme', state.isDarkmode ? 'dark' : 'light');
    document.documentElement.setAttribute('fade-in', state.enableFadeIn ? 'true' : 'false');
    document.documentElement.setAttribute('task-animation', state.enableTaskAnimation ? 'true' : 'false');
  }, [state])

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="App">
      <div id="effects-layer"></div>
      <SettingsBar />
      <div className="App-content">
        <Switch key={location} location={location}>
          <Route path="/index.html/help">
            <Help />
          </Route>
          <Route path="/index.html/settings">
            <Settings />
          </Route>
          <Home tasks={tasks} setTasks={setTasks} />
        </Switch>
      </div>
    </div>
  );
}

type IHome = Pick<IVisualization & IEditor, 'tasks' | 'setTasks'>;
function Home({ tasks, setTasks }: IHome) {
  const { mode, setMode } = useCanvasStore();
  return (<div className="home-workspace">
    <header className="workspace-switcher">
      <span className="workspace-brand">Tabspace<span aria-hidden="true"> ✦</span></span>
      <div className="workspace-tabs" role="group" aria-label="Workspace view">
        <button type="button" aria-pressed={mode === 'document'} onClick={() => setMode('document')}>Document</button>
        <button type="button" aria-pressed={mode === 'canvas'} onClick={() => setMode('canvas')}>Canvas</button>
      </div>
    </header>
    {mode === 'canvas' ? <Canvas /> : <div className="document-workspace">
      <Visualization tasks={tasks} />
      <Editor setTasks={setTasks} />
    </div>}
  </div>)
}

export default App;
