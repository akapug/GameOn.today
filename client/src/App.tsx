import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import CreateGame from "./pages/CreateGame";
import Game from "./pages/Game";
import { AuthProvider } from "./components/AuthProvider";
import UserMenu from "./components/UserMenu";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <h1 className="text-lg font-semibold">Sports Games</h1>
            <UserMenu />
          </div>
        </header>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/create" component={CreateGame} />
          <Route path="/games/:id" component={Game} />
        </Switch>
      </div>
    </AuthProvider>
  );
}

export default App;