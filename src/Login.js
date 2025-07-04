import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// --- CORREÇÃO AQUI ---
// Trocado 'axios' pela nossa instância 'api' configurada
import api from './axiosConfig'; 
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      setError('Preencha todos os campos.');
      return;
    }

    try {
      // --- CORREÇÃO AQUI ---
      // A URL agora usa o baseURL do 'axiosConfig.js' ('http://localhost:3001')
      const response = await api.post('/auth/login', { email, senha });

      // Armazenar token JWT para autenticação nas próximas requisições
      localStorage.setItem('token', response.data.token);
      console.log(response.data);

      // Armazenar email do usuário logado (opcional)
      localStorage.setItem('usuarioLogado', JSON.stringify({ email }));

      setError('');
      navigate('/');
    } catch (err) {
      setError('Credenciais inválidas.');
      console.error("Erro no login:", err);
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h1 className="title">Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="input"
        />

        {error && <p className="error">{error}</p>}

        <button className="button" onClick={handleLogin}>
          Entrar
        </button>

        <button className="button-outline" onClick={() => navigate('/cadastro')}>
          Cadastrar-se
        </button>
      </div>
    </div>
  );
}