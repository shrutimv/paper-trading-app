import { BASE_URL } from "@/src/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

export type User = {
    id?: string;
    username: string;
    email?: string;
    balance: number;
    isGuest: boolean;
};

type AuthContextType = {
    user: User | null;

    isGuest: boolean;
    isLoggedIn: boolean;
    loading: boolean;

    login: (user: User) => Promise<void>;
    continueAsGuest: () => Promise<void>;
    logout: () => Promise<void>;

    updateBalance: (balance: number) => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export const AuthProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);

    const [isLoggedIn, setIsLoggedIn] =
        useState(false);

    useEffect(() => {

        loadSession();

    }, []);

    const loadSession = async () => {

        try {

            const session =
                await AsyncStorage.getItem("userSession");

            if (!session) {

                setLoading(false);
                return;

            }

            const user = JSON.parse(session);

            if (user.isGuest) {

                setUser(user);

                setIsGuest(true);

                setIsLoggedIn(false);

            } else {

                setUser(user);

                setIsGuest(false);

                setIsLoggedIn(true);

            }

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }

    };

    const continueAsGuest = async () => {

        const guestUser: User = {
            username: "Guest User",
            balance: 100000,
            isGuest: true,
        };

        await AsyncStorage.setItem(
            "userSession",
            JSON.stringify(guestUser)
        );

        setUser(guestUser);

        setIsGuest(true);
        setIsLoggedIn(false);
        // setUser({
        //     username: "Guest User",
        //     balance: 100000,
        //     isGuest: true,
        // });
    };

    const login = async (user: User) => {
        await AsyncStorage.setItem(
            "userSession",
            JSON.stringify(user)
        );

        setUser(user);

        setIsGuest(false);
        setIsLoggedIn(true);
    };
    const logout = async () => {

        await AsyncStorage.removeItem("userSession");

        setIsGuest(false);
        setIsLoggedIn(false);
        setUser(null);

    };

    const refreshUser = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}/api/auth/me`,
                {
                    credentials: "include",
                }
            );

            const data = await response.json();
            console.log("ME API RESPONSE", data);

            if (!response.ok) return;

            const updatedUser = {
                ...data.user,
                isGuest: false,
            };

            setUser(updatedUser);

            await AsyncStorage.setItem(
                "userSession",
                JSON.stringify(updatedUser)
            );

        } catch (err) {
            console.log("REFRESH USER ERROR");
            console.log(err);
        }
    };

    const updateBalance = async (balance: number) => {

        if (!user) return;

        const updatedUser = {
            ...user,
            balance,
        };

        setUser(updatedUser);

        await AsyncStorage.setItem(
            "userSession",
            JSON.stringify(updatedUser)
        );
    };

    return (
        <AuthContext.Provider
            value={{
                user,

                isGuest,
                isLoggedIn,
                loading,

                login,
                continueAsGuest,
                logout,
                updateBalance,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = () => {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;

};