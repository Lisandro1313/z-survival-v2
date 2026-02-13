/**
 * 📍 NODE INFO - Información del nodo actual
 */

import type { Node } from '../../types';
import './NodeInfo.css';

interface Props {
  node: Node | null;
}

function NodeInfo({ node }: Props) {
  if (!node) {
    return (
      <div className="node-info">
        <p>Cargando ubicación...</p>
      </div>
    );
  }

  return (
    <div className="node-info">
      <h3>📍 {node.nombre}</h3>
      <p className="node-desc">{node.descripcion}</p>

      <div className="node-stats">
        <span className="node-type">{node.tipo}</span>
        <span className="node-danger">⚠️ Peligro: {node.peligro}/10</span>
      </div>

      {node.playersPresent !== undefined && node.playersPresent > 0 && (
        <div className="node-players">
          <span>👥 {node.playersPresent} jugadores aquí</span>
        </div>
      )}

      {node.conectadoCon && node.conectadoCon.length > 0 && (
        <div className="node-connections">
          <h4>Conexiones:</h4>
          <ul>
            {node.conectadoCon.map((nodeId) => (
              <li key={nodeId}>{nodeId}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NodeInfo;
