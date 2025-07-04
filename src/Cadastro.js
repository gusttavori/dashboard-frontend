import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './axiosConfig';

export default function Cadastro() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email || !senha || !confirmarSenha) {
      setError('Preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      const registrationUrl = '/auth/usuarios';
      console.log(`Tentando fazer POST para: ${api.defaults.baseURL}${registrationUrl}`);
      await api.post(registrationUrl, { email, senha });
      
      setError('');
      alert('Cadastro realizado com sucesso!');
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('Email já cadastrado.');
      } else {
        setError('Erro ao cadastrar. Tente novamente.');
        console.error("Erro detalhado no cadastro:", err);
      }
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h1 className="title">Cadastro</h1>

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

        <input
          type="password"
          placeholder="Confirmar Senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="input"
        />

        {error && <p className="error">{error}</p>}

        <button className="button" onClick={handleRegister}>
          Cadastrar
        </button>

        <button className="button-outline" onClick={() => navigate('/login')}>
          Voltar para Login
        </button>
      </div>
    </div>
  );
}