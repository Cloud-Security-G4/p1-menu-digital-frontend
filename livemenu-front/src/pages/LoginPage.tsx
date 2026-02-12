import { login } from "../services/authService"
import { useState } from "react"


export default function LoginPage() {

    const [loading, setLoading] = useState(false)
    const [isRegister, setIsRegister] = useState(false)
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")

    const handleLogin = async () => {
        const trimmedEmail = email.trim()
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
        if (!isValidEmail) {
            setEmailError("Ingresa un correo válido.")
            return
        }

        setLoading(true)
        setEmailError("")

        try {
            const data = await login(trimmedEmail, password)
            console.log("Respuesta API:", data)
        } catch (error) {
            console.error(error)
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
            console.log("Registro:", { fullName, email: trimmedEmail })
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="flex h-screen">

            {/* LEFT SIDE */}
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


            {/* RIGHT SIDE */}
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
