import { login, register } from "../services/authService"
import { useNavigate } from "react-router-dom"
import { useState } from "react"


// login + registration in one screen
export default function LoginPage() {

    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [isRegister, setIsRegister] = useState(false)
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [authError, setAuthError] = useState("")

    const getErrorMessage = (error: unknown) => {
        if (error instanceof Error) {
            const raw = error.message
            try {
                const parsed = JSON.parse(raw) as { message?: string }
                return parsed?.message || "Credenciales inválidas"
            } catch {
                return raw || "Credenciales inválidas"
            }
        }
        return "Credenciales inválidas"
    }

    const handleAuthSuccess = (data: any) => {
        if (data?.token) {
            localStorage.setItem("authToken", data.token)
        }
        if (data?.user) {
            localStorage.setItem("authUser", JSON.stringify(data.user))
        }
        navigate("/admin")
    }

    const handleLogin = async () => {
        const trimmedEmail = email.trim()
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
        if (!isValidEmail) {
            setEmailError("Ingresa un correo válido.")
            return
        }

        setLoading(true)
        setEmailError("")
        setAuthError("")

        try {
            const data = await login(trimmedEmail, password)
            handleAuthSuccess(data)
        } catch (error) {
            setAuthError(getErrorMessage(error))
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async () => {
        const trimmedEmail = email.trim()
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
        if (!isValidEmail) {
            setEmailError("Ingresa un correo válido.")
            return
        }
        if (!fullName.trim()) {
            setPasswordError("Ingresa tu nombre completo.")
            return
        }
        if (!password || password !== confirmPassword) {
            setPasswordError("Las contraseñas no coinciden.")
            return
        }

        setLoading(true)
        setEmailError("")
        setPasswordError("")

        try {
            const data = await register(fullName.trim(), trimmedEmail, password)
            handleAuthSuccess(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="flex h-screen">

            {/* Left marketing panel */}
            <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-900 text-white items-center justify-center p-10">
                <div>
                    <h1 className="text-4xl font-bold mb-4">
                        Bienvenido a LiveMenu 👋
                    </h1>

                    <p className="text-lg opacity-90">
                        Administra menús digitales fácilmente.
                    </p>
                </div>
            </div>


            {/* Auth form panel */}
            <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-100">

                <div className="bg-white p-8 rounded-xl shadow-md w-80">

                    <h2 className="text-2xl font-bold mb-6 text-center">
                        {isRegister ? "Crear cuenta" : "Iniciar sesión"}
                    </h2>

                    {isRegister && (
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            className="w-full mb-3 p-2 border rounded"
                            value={fullName}
                            onChange={(e) => {
                                setFullName(e.target.value)
                                if (passwordError) setPasswordError("")
                            }}
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Correo"
                        className={`w-full mb-1 p-2 border rounded ${emailError ? "border-red-500" : "border-gray-300"}`}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            if (emailError) setEmailError("")
                            if (authError) setAuthError("")
                        }}
                        aria-invalid={emailError ? "true" : "false"}
                    />
                    {emailError && (
                        <p className="mb-3 text-sm text-red-600">
                            {emailError}
                        </p>
                    )}

                    <input
                        type="password"
                        placeholder="Contraseña"
                        className={`w-full ${isRegister ? "mb-3" : "mb-4"} p-2 border rounded ${passwordError ? "border-red-500" : "border-gray-300"}`}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            if (passwordError) setPasswordError("")
                            if (authError) setAuthError("")
                        }}
                    />

                    {isRegister && (
                        <input
                            type="password"
                            placeholder="Confirmar contraseña"
                            className={`w-full mb-1 p-2 border rounded ${passwordError ? "border-red-500" : "border-gray-300"}`}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                if (passwordError) setPasswordError("")
                            }}
                        />
                    )}

                    {passwordError && (
                        <p className="mb-3 text-sm text-red-600">
                            {passwordError}
                        </p>
                    )}
                    {authError && !isRegister && (
                        <p className="mb-3 text-sm text-red-600">
                            {authError}
                        </p>
                    )}

                    <button
                        onClick={isRegister ? handleRegister : handleLogin}
                        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? "Cargando..." : (isRegister ? "Crear cuenta" : "Entrar")}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister)
                            setEmailError("")
                            setPasswordError("")
                        }}
                        className="mt-4 w-full text-sm text-blue-600 hover:underline"
                    >
                        {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                    </button>

                </div>
            </div>

        </div>
    )
}
