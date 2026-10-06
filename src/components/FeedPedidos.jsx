import React, { useState, useEffect } from 'react';
import '../styles/FeedPedidos.css';

export default function FeedPedidos({ pedidos: pedidosProp = [] }) {
  const [pedidosServidor, setPedidosServidor] = useState([]);
  const [busca, setBusca] = useState('');

  // Busca os pedidos diretamente da API do Node ao carregar
  useEffect(() => {
    async function carregarPedidos() {
      try {
        const response = await fetch('http://localhost:3000/api/pedidos');
        if (response.ok) {
          const data = await response.json();
          setPedidosServidor(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Erro ao buscar pedidos do servidor:', error);
      }
    }

    carregarPedidos();
  }, []);

  // Junta os pedidos recém-criados no App com os pedidos vindos do servidor
  const todosPedidos = [...pedidosProp, ...pedidosServidor];

  // Filtra por termo de busca e remove duplicatas
  const pedidosFiltrados = todosPedidos
    .filter((pedido, index, self) =>
      index === self.findIndex((p) => (p.id && p.id === pedido.id) || p.titulo === pedido.titulo)
    )
    .filter((pedido) =>
      pedido.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
      pedido.categoria?.toLowerCase().includes(busca.toLowerCase()) ||
      pedido.descricao?.toLowerCase().includes(busca.toLowerCase())
    );

  return (
    <div className="feed-pedidos-container">
      <h2>Pedidos Disponíveis</h2>

      <div className="busca-container" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Buscar pedidos por título ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      {pedidosFiltrados.length === 0 ? (
        <p>Nenhum pedido encontrado.</p>
      ) : (
        <div className="lista-pedidos">
          {pedidosFiltrados.map((pedido, index) => (
            <div key={pedido.id || index} className="card-pedido" style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
              <h3>{pedido.titulo}</h3>
              <p><strong>Categoria:</strong> {pedido.categoria}</p>
              <p><strong>Descrição:</strong> {pedido.descricao}</p>
              {pedido.localizacao && <p><strong>Localização:</strong> {pedido.localizacao}</p>}
              {pedido.prazo && <p><strong>Prazo:</strong> {pedido.prazo}</p>}
              <p><strong>Status:</strong> {pedido.status || 'Disponível'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}