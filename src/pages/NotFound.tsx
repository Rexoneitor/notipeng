import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export function NotFound() {
  return (
    <div className="page narrow">
      <Empty line="Esta página se perdió entre el hielo." hint="Quizá se movió, o nunca existió.">
        <Link to="/" className="btn btn-primary">Volver a la Mesa</Link>
      </Empty>
    </div>
  );
}
