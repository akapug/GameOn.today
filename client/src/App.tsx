import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import CreateGame from "./pages/CreateGame";
import Game from "./pages/Game";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateGame} />
      <Route path="/games/:id" component={Game} />
    </Switch>
  );
}

export default App;