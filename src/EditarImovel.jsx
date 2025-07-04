import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from './axiosConfig';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './AdminImoveis.css';

const MySwal = withReactContent(Swal);

function EditarImovel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [imagensExistentes, setImagensExistentes] = useState([]);
  const [novasImagens, setNovasImagens] = useState([]);
  const [previewsNovasImagens, setPreviewsNovasImagens] = useState([]);

  useEffect(() => {
    const buscarImovel = async () => {
      try {
        const res = await api.get(`/imoveis/${id}`);
        const imovel = res.data;
        if (imovel) {
          setForm(imovel);
          setImagensExistentes(imovel.imagens || []);
        } else {
          MySwal.fire('Erro', 'Imóvel não encontrado.', 'error');
          navigate('/admin');
        }
      } catch (error) {
        console.error('Erro ao buscar imóvel:', error);
        MySwal.fire('Erro', 'Falha ao carregar os dados do imóvel.', 'error');
        navigate('/admin');
      } finally {
        setLoading(false);
      }
    };
    if (id) buscarImovel();
  }, [id, navigate]);

  useEffect(() => {
    return () => {
      previewsNovasImagens.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewsNovasImagens]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (files) => {
    const arquivosArray = Array.from(files);
    setNovasImagens(prev => [...prev, ...arquivosArray]);
    const urlsPreview = arquivosArray.map(file => URL.createObjectURL(file));
    setPreviewsNovasImagens(prev => [...prev, ...urlsPreview]);
  };

  // --- CORREÇÃO AQUI: Funções adicionadas de volta ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };
  // --- FIM DA CORREÇÃO ---
  
  const removerImagemExistente = (idx) => setImagensExistentes(prev => prev.filter((_, i) => i !== idx));
  
  const removerNovaImagem = (idx) => {
    URL.revokeObjectURL(previewsNovasImagens[idx]);
    setNovasImagens(prev => prev.filter((_, i) => i !== idx));
    setPreviewsNovasImagens(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const urlsNovasImagens = [];
      for (const imagem of novasImagens) {
        const formData = new FormData();
        formData.append('image', imagem);
        const res = await api.post('/upload', formData);
        urlsNovasImagens.push(res.data.filePath);
      }

      const todasAsImagens = [...imagensExistentes, ...urlsNovasImagens];

      const dataParaEnviar = {
        titulo: form.titulo,
        descricao: form.descricao,
        preco: form.preco,
        cidade: form.cidade,
        bairro: form.bairro,
        tipo: form.tipo,
        finalidade: form.finalidade,
        dormitorios: Number(form.dormitorios),
        banheiros: Number(form.banheiros),
        area: Number(form.area),
        piscina: form.piscina,
        valorCondominio: form.valorCondominio ? parseFloat(form.valorCondominio) : null,
        garagem: form.garagem,
        destaque: form.destaque,
        imagens: todasAsImagens,
      };

      await api.put(`/imoveis/${id}`, dataParaEnviar);
      MySwal.fire('Sucesso!', 'Imóvel atualizado com sucesso!', 'success');
      navigate('/admin');

    } catch (err) {
      console.error('Erro ao atualizar imóvel:', err.response?.data || err.message);
      const mensagemErro = err.response?.data?.message || err.response?.data?.erros?.join(', ') || 'Não foi possível atualizar o imóvel.';
      MySwal.fire('Erro', mensagemErro, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-container">Carregando...</div>;
  if (!form) return <div className="admin-container">Imóvel não encontrado.</div>;

  return (
    <div className="admin-container">
      <nav className="breadcrumb">
        <Link to="/admin">Gerenciar Imóveis</Link>
        <span>&gt;</span>
        <span>Editar Imóvel</span>
      </nav>

      <h1>Editar Imóvel: {form.titulo}</h1>

      <form className="form" onSubmit={handleSubmit}>
        <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0 }}>
          <input name="titulo" placeholder="Título" value={form.titulo} onChange={handleChange} />
          <textarea name="descricao" placeholder="Descrição" value={form.descricao} onChange={handleChange} />
          
          <div className="form-row">
            <select name="finalidade" value={form.finalidade} onChange={handleChange}>
              <option value="">Finalidade</option>
              <option value="venda">Venda</option>
              <option value="locacao">Locação</option>
            </select>
            <select name="tipo" value={form.tipo} onChange={handleChange}>
              <option value="">Tipo do Imóvel</option>
              <option value="casa">Casa</option>
              <option value="apartamento">Apartamento</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Salas Comerciais</option>
            </select>
            <div className="preco-wrapper">
              {form.preco && String(form.preco).toUpperCase() !== 'CONSULTAR VALOR' && <span className="prefixo">R$</span>}
              <input name="preco" type="text" placeholder="Valor ou 'CONSULTAR VALOR'" value={form.preco} onChange={handleChange} style={{ paddingLeft: String(form.preco).toUpperCase() !== 'CONSULTAR VALOR' ? '35px' : '10px' }} />
            </div>
          </div>

          <div className="form-row">
            <input name="dormitorios" type="number" placeholder="Dormitórios" value={form.dormitorios} onChange={handleChange} />
            <input name="banheiros" type="number" placeholder="Banheiros" value={form.banheiros} onChange={handleChange} />
            <input name="area" type="number" placeholder="Área (m²)" value={form.area} onChange={handleChange} />
          </div>

          <div className="form-row">
            <input name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} />
            <input name="bairro" placeholder="Bairro" value={form.bairro} onChange={handleChange} />
          </div>

          <div className="form-row">
            <input name="valorCondominio" type="number" placeholder="Valor do Condomínio (Opcional)" value={form.valorCondominio || ''} onChange={handleChange} />
          </div>

          <div className="form-row checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" name="piscina" checked={form.piscina || false} onChange={handleChange} />
              Possui Piscina?
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="garagem" checked={form.garagem || false} onChange={handleChange} />
              Possui Garagem?
            </label>
             <label className="checkbox-label">
              <input type="checkbox" name="destaque" checked={form.destaque || false} onChange={handleChange} />
              Destaque?
            </label>
          </div>

          <label className={`image-upload ${dragActive ? 'drag-active' : ''}`} onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}>
            📷 Clique ou arraste novas imagens aqui
            <input type="file" name="novasImagens" multiple onChange={(e) => handleFileChange(e.target.files)} style={{display: 'none'}} />
          </label>

          <div className="preview-container">
            {imagensExistentes.map((img, idx) => (
              <div className="preview-item" key={`existente-${idx}`}>
                <img src={img} alt={`existente-${idx}`} />
                <button type="button" onClick={() => removerImagemExistente(idx)}>×</button>
              </div>
            ))}
            {previewsNovasImagens.map((img, idx) => (
              <div className="preview-item" key={`nova-${idx}`}>
                <img src={img} alt={`nova-preview-${idx}`} />
                <button type="button" onClick={() => removerNovaImagem(idx)}>×</button>
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </fieldset>
      </form>
    </div>
  );
}

export default EditarImovel;
