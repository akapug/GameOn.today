import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import CreateGame from "./pages/CreateGame";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateGame} />
    </Switch>
  );
}

export default App;
