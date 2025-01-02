import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import CreateGame from "./pages/CreateGame";
import Game from "./pages/Game";
import { AuthProvider } from "./components/AuthProvider";
import UserMenu from "./components/UserMenu";
import Footer from "./components/Footer";
import Logo from "./components/Logo";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4 md:px-6">
            <Logo />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/create" component={CreateGame} />
            <Route path="/games/:id" component={Game} />
          </Switch>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;