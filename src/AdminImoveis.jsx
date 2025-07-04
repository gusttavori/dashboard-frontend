import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './axiosConfig';
import Swal from 'sweetalert2'; // Importar o SweetAlert2
import withReactContent from 'sweetalert2-react-content'; // Importar o wrapper
import './AdminImoveis.css';

const MySwal = withReactContent(Swal); // Inicializar o SweetAlert2

function AdminImoveis() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState([]);

  // MELHORIA 1: Usar a instância do 'api' para a busca.
  // Isso garante que, se a rota for protegida, o token será enviado automaticamente.
  useEffect(() => {
    api.get('/imoveis')
      .then(res => {
        // A sua API retorna um objeto { imoveis: [...] }, então acessamos res.data.imoveis
        setImoveis(res.data.imoveis || res.data); // Flexível para ambos os formatos de resposta
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao buscar imóveis:', err);
        setLoading(false);
      });
  }, []);

  // MELHORIA 2: Usar SweetAlert2 para confirmação, em vez do window.confirm.
  const excluirImovel = async (id) => {
    const result = await MySwal.fire({
      title: 'Tem certeza?',
      text: "Você não poderá reverter esta ação!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/imoveis/${id}`);
        setImoveis(prevImoveis => prevImoveis.filter(imovel => imovel._id !== id));
        MySwal.fire(
          'Excluído!',
          'O imóvel foi removido com sucesso.',
          'success'
        );
      } catch (error) {
        console.error('Erro ao excluir imóvel:', error.response || error.message || error);
        MySwal.fire(
          'Erro!',
          `Não foi possível excluir o imóvel. ${error.response?.data?.erro || error.message}`,
          'error'
        );
      }
    }
  };

  const editarImovel = (id) => {
    navigate(`/admin/editar/${id}`);
  };

  return (
    <div className="admin-container">
      <nav className="breadcrumb">
        {/* Usar a função navigate para navegação interna */}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/app'); }}>Início</a>
        <span style={{ margin: '0 8px' }}>&gt;</span>
        <span>Gerenciar imóveis</span>
      </nav>

      <h1>Gerencie seus imóveis</h1>

      {loading ? (
        <p>Carregando imóveis...</p>
      ) : (
        <div className="cards-container">
          {imoveis.length === 0 ? (
            <p>Nenhum imóvel cadastrado.</p>
          ) : (
            imoveis.map((imovel) => (
              // A "key" já estava correta, garantindo que ela use um valor único.
              <div className="card" key={imovel._id}>
                <img src={imovel.imagens?.[0]} alt={imovel.titulo} />
                <div className="valor">
                  {typeof imovel.preco === 'string'
                    ? imovel.preco.toUpperCase()
                    : `R$ ${Number(imovel.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </div>
                <div className="info">
                  <h3>{imovel.titulo}</h3>
                  <p>{imovel.bairro}</p>
                  <p>Dormitórios: {imovel.dormitorios} | Banheiros: {imovel.banheiros}</p>
                </div>
                <div className="acoes">
                  <button className="editar" onClick={() => editarImovel(imovel._id)}>Editar</button>
                  <button className="excluir" onClick={() => excluirImovel(imovel._id)}>Excluir</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminImoveis;
