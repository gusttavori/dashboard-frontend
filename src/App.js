import { useEffect, useState } from 'react';
import api from './axiosConfig';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import './App.css';

const MySwal = withReactContent(Swal);

function App() {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    preco: '',
    cidade: '',
    bairro: '',
    tipo: '',
    finalidade: '',
    dormitorios: '',
    banheiros: '',
    area: '',
    imagens: [],
    piscina: false,
    valorCondominio: '',
    garagem: false,
    destaque: false,
  });

  const [previewImagens, setPreviewImagens] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    buscarImoveis();
  }, []);

  useEffect(() => {
    return () => {
      previewImagens.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewImagens]);

  const buscarImoveis = () => {
    api.get('/imoveis/mais-visualizados')
      .then(res => setImoveis(res.data))
      .catch(err => console.error('Erro ao buscar imóveis:', err));
  };

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;

    if (name === 'imagens') {
      const arquivos = Array.from(files);
      const validos = [];
      const invalidos = [];
      arquivos.forEach(file => {
        const tipoValido = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
        const tamanhoValido = file.size <= 2 * 1024 * 1024; // 2MB
        if (tipoValido && tamanhoValido) {
          validos.push(file);
        } else {
          invalidos.push(file.name);
        }
      });

      if (invalidos.length > 0) {
        MySwal.fire({
          icon: 'warning',
          title: 'Arquivo(s) inválido(s)',
          text: `Os seguintes arquivos foram rejeitados (formato ou tamanho inválido):\n${invalidos.join(', ')}`
        });
      }

      if (validos.length === 0) return;

      setForm(prev => ({ ...prev, imagens: [...prev.imagens, ...validos] }));
      setPreviewImagens(prev => [...prev, ...validos.map(file => URL.createObjectURL(file))]);

    } else if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const removerImagem = index => {
    const novasImagens = [...form.imagens];
    const novasPreviews = [...previewImagens];
    novasImagens.splice(index, 1);
    URL.revokeObjectURL(novasPreviews[index]);
    novasPreviews.splice(index, 1);
    setForm(prev => ({ ...prev, imagens: novasImagens }));
    setPreviewImagens(novasPreviews);
  };

  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fakeEvent = { target: { name: 'imagens', files: e.dataTransfer.files } };
      handleChange(fakeEvent);
      e.dataTransfer.clearData();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAdmin = () => {
    navigate('/admin');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { titulo, descricao, preco, cidade, bairro, tipo, finalidade, area, imagens } = form;

    // --- MODIFICAÇÃO 1: Removida a validação de 'dormitorios' e 'banheiros' ---
    // Agora eles não são mais obrigatórios.
    if (!titulo || !descricao || !preco || !cidade || !bairro || !tipo || !finalidade || !area || imagens.length === 0) {
      return MySwal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Preencha todos os campos obrigatórios e selecione ao menos uma imagem.' });
    }

    try {
      setLoading(true);
      const urls = [];
      for (const imagem of form.imagens) {
        const fd = new FormData();
        fd.append('image', imagem);
        try {
          const uploadRes = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          urls.push(uploadRes.data.filePath);
        } catch {
          await MySwal.fire({ icon: 'error', title: 'Erro no upload', text: 'Falha ao enviar uma ou mais imagens.' });
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      const precoFinal = form.preco.toUpperCase() === 'CONSULTAR VALOR' ? form.preco : parseFloat(form.preco);

      // --- MODIFICAÇÃO 2: Payload ajustado para campos opcionais ---
      // Se 'dormitorios' ou 'banheiros' estiverem vazios, serão enviados como 'undefined'
      // e omitidos do JSON final, o que é ideal para campos opcionais no backend.
      const payloadFinal = {
        ...form,
        preco: precoFinal,
        dormitorios: form.dormitorios ? parseInt(form.dormitorios, 10) : undefined,
        banheiros: form.banheiros ? parseInt(form.banheiros, 10) : undefined,
        area: parseFloat(form.area),
        valorCondominio: form.valorCondominio ? parseFloat(form.valorCondominio) : null,
        imagens: urls
      };

      console.log('Payload enviado para o backend:', payloadFinal);
      await api.post('/imoveis', payloadFinal, { headers: { Authorization: `Bearer ${token}` } });
      alert('Imóvel cadastrado com sucesso!');
      
      setForm({
        titulo: '',
        descricao: '',
        preco: '',
        cidade: '',
        bairro: '',
        tipo: '',
        finalidade: '',
        dormitorios: '',
        banheiros: '',
        area: '',
        imagens: [],
        piscina: false,
        valorCondominio: '',
        garagem: false,
        destaque: false,
      });
      setPreviewImagens([]);
      buscarImoveis();

    } catch (error) {
      const camposAmigaveis = {
        titulo: 'Título', descricao: 'Descrição', preco: 'Preço', cidade: 'Cidade',
        bairro: 'Bairro', tipo: 'Tipo do imóvel', dormitorios: 'Dormitórios',
        banheiros: 'Banheiros', area: 'Área', imagens: 'Imagens', destaque: 'Destaque',
        finalidade: 'Finalidade', piscina: 'Piscina', valorCondominio: 'Valor do Condomínio',
        garagem: 'Garagem'
      };

      if (error.response && error.response.data && error.response.data.erros) {
        const mensagens = error.response.data.erros.map(msg => {
          const campo = Object.keys(camposAmigaveis).find(chave => msg.includes(`"${chave}"`));
          return campo ? msg.replace(`"${campo}"`, camposAmigaveis[campo]) : msg;
        });
        MySwal.fire({ icon: 'error', title: 'Erro de validação', html: `<ul style="text-align: left;">${mensagens.map(msg => `<li>${msg}</li>`).join('')}</ul>`, customClass: { popup: 'swal-wide' } });
      } else {
        console.error('Erro ao cadastrar imóvel:', error);
        MySwal.fire({ icon: 'error', title: 'Erro desconhecido', text: 'Não foi possível cadastrar o imóvel. Tente novamente.' });
      }
    } finally {
        setLoading(false); // Garante que o loading seja desativado
    }
  };

  return (
    <div className="App">
      <header className="navbar">
        <div className="logo">
          <img src="/gr_CRECI.png" alt="Logo" />
        </div>
        <nav className="menu">
          <a href="#" onClick={handleAdmin}>Gerenciar imóveis</a>
          <a href="#" onClick={handleLogout} className="logout-button">Sair</a>
        </nav>
      </header>

      <h2 className="form-title">Painel do Corretor | Cadastro de Imóveis</h2>

      <form className="form" onSubmit={handleSubmit}>
        <fieldset disabled={loading} style={{border: 'none', padding: 0, margin: 0}}>
          <input name="titulo" placeholder="Título" value={form.titulo} onChange={handleChange} />
          <textarea name="descricao" placeholder="Descrição do Imóvel" value={form.descricao} onChange={handleChange} />

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
              {form.preco && form.preco.toUpperCase() !== 'CONSULTAR VALOR' && <span className="prefixo">R$</span>}
              <input name="preco" type="text" placeholder="Valor do Imóvel ou 'CONSULTAR VALOR'" value={form.preco} onChange={handleChange} style={{ paddingLeft: form.preco.toUpperCase() !== 'CONSULTAR VALOR' ? '35px' : '10px' }} />
            </div>
          </div>

          <div className="form-row">
            <input name="dormitorios" type="number" placeholder="Dormitórios (Opcional)" value={form.dormitorios} onChange={handleChange} />
            <input name="banheiros" type="number" placeholder="Banheiros (Opcional)" value={form.banheiros} onChange={handleChange} />
            <input name="area" type="number" placeholder="Área (m²)" value={form.area} onChange={handleChange} />
          </div>

          <div className="form-row">
            <input name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} />
            <input name="bairro" placeholder="Bairro" value={form.bairro} onChange={handleChange} />
          </div>
          
          <div className="form-row">
            <input name="valorCondominio" type="number" placeholder="Valor do Condomínio (Opcional)" value={form.valorCondominio} onChange={handleChange} />
          </div>

          <div className="form-row checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" name="piscina" checked={form.piscina} onChange={handleChange} />
              Possui Piscina?
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="garagem" checked={form.garagem} onChange={handleChange} />
              Possui Garagem?
            </label>
          </div>

          <label className={`image-upload ${dragActive ? 'drag-active' : ''}`} onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}>
            📷 Clique ou arraste a imagem aqui
            <input type="file" name="imagens" multiple onChange={handleChange} style={{ display: 'none' }} />
          </label>

          <p className="image-info">
            A dimensão recomendada é de 1920 x 1080<br />
            Formato: JPG, JPEG, PNG, WEBP de no máximo 2MB.
          </p>

          <div className="preview-container">
            {previewImagens.map((img, idx) => (
              <div className="preview-item" key={idx}>
                <img src={img} alt={`preview-${idx}`} />
                <button type="button" onClick={() => removerImagem(idx)}>×</button>
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Enviando...' : 'Cadastrar imóvel'}
          </button>
        </fieldset>
      </form>

      <footer>
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/gr_CRECI.png" alt="Logo do Corretor de Imóveis" />
          </div>
        </div>
        <p className="footer-copy">
          &copy; 2025 Desenvolvido por <a href="https://dgustatecnologia.vercel.app/" target="_blank" rel="noreferrer" className="footer-link">dgustaTecnologia</a>. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

export default App;
