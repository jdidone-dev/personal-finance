import { CarteiraProvider, useCarteira } from './context/CarteiraContext';
import { FileHandler } from './components/FileHandler/FileHandler';
import { Dashboard } from './components/Dashboard/Dashboard';

function AppRouter() {
  const { carteira } = useCarteira();
  return carteira ? <Dashboard /> : <FileHandler />;
}

export default function App() {
  return (
    <CarteiraProvider>
      <AppRouter />
    </CarteiraProvider>
  );
}
