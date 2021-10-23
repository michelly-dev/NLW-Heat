import { createContext, ReactNode, useState } from "react";
import { useEffect } from 'react';
import { api } from '../services/api';

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  singOut: () => void;
}

export const AuthContext = createContext({} as AuthContextData)

type AuthProvider = {
  children: ReactNode;
}

type AuthResponse = {
  token: string;
  user: {
    name: string;
    id: string;
    avatar_url: string;
    login: string
  }
}

export function AuthProvider(props: AuthProvider) {

  const [user, setUser] = useState<User | null>(null)

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=c0be8733125a4d607763`;

  async function signIn(githubCode: string) { 
    

    const response = await api.post<AuthResponse>('authenticate', {
      code: githubCode,
      origin: 'FRONT'
    })

    console.log('githubCode', response.data)
    
    const { token, user } = response.data

    api.defaults.headers.common.authorization = `Bearer ${token}`;

    localStorage.setItem('@dowhile:token', token)

    setUser(user)
  }

  function singOut() {
    setUser(null)
    localStorage.removeItem('@dowhile:token')
  }

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token')

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;

      api.get<User>('profile').then(response => {
        setUser(response.data)
      })
    }
  }, [])

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=');

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split('?code=')

      window.history.pushState({}, '', urlWithoutCode)

      signIn(githubCode);
    }
  }, [])

  return (
    <AuthContext.Provider value={{ signInUrl, user, singOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}