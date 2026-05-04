import { useState, useRef, useEffect } from "react";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, getDocs, setDoc, onSnapshot, updateDoc, collection, deleteDoc } from "firebase/firestore";
import {
  Settings,
  X,
  ChevronRight,
  CheckCircle2,
  XCircle,
  LogOut,
  Copy,
  Check,
  Maximize,
  Minimize,
  Clock,
  BookOpen,
  HelpCircle,
  User,
} from "lucide-react";
import { Route, Switch, useLocation } from "wouter";
import { motion, AnimatePresence } from "motion/react";

const MAX_TILE = 100;

export const boardThemes = [
  { id: "classic", name: "Classic Primary", colors: ["#ffca28", "#ffffff", "#42a5f5", "#ef5350", "#66bb6a"] },
  { id: "ocean", name: "Ocean Depths", colors: ["#0077b6", "#00b4d8", "#90e0ef", "#caf0f8", "#03045e"] },
  { id: "forest", name: "Enchanted Forest", colors: ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2"] },
  { id: "sunset", name: "Sunset Valley", colors: ["#ff7b00", "#ff9500", "#ffaa00", "#ffc300", "#ffd000"] },
  { id: "pastel", name: "Pastel Dream", colors: ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff"] },
  { id: "neon", name: "Cyber Neon", colors: ["#ff00ff", "#00ffff", "#00ff00", "#ffff00", "#111111"] },
  { id: "monochrome", name: "Black & White", colors: ["#e0e0e0", "#ffffff", "#bdbdbd", "#9e9e9e", "#fafafa"] },
  { id: "earth", name: "Earthy Vibes", colors: ["#606c38", "#a98467", "#dda15e", "#bc6c25", "#fefae0"] }
];

interface ColorOpt {
  name: string;
  hex: string;
  bg: string;
}
const colors: ColorOpt[] = [
  { name: "Red Team", hex: "#ef4444", bg: "bg-red-500" },
  { name: "Green Team", hex: "#22c55e", bg: "bg-green-500" },
  { name: "Blue Team", hex: "#3b82f6", bg: "bg-blue-500" },
  { name: "Yellow Team", hex: "#eab308", bg: "bg-yellow-500" },
  { name: "Purple Team", hex: "#a855f7", bg: "bg-purple-500" },
  { name: "Orange Team", hex: "#f97316", bg: "bg-orange-500" },
];

const snakes = [
  {
    head: 98,
    tail: 80,
    color1: "#8b5cf6",
    color2: "#7c3aed",
    pattern: "#c4b5fd",
  },
  {
    head: 95,
    tail: 75,
    color1: "#22c55e",
    color2: "#16a34a",
    pattern: "#86efac",
  },
  {
    head: 92,
    tail: 88,
    color1: "#ef4444",
    color2: "#dc2626",
    pattern: "#fca5a5",
  },
  {
    head: 83,
    tail: 57,
    color1: "#f59e0b",
    color2: "#d97706",
    pattern: "#fcd34d",
  },
  {
    head: 74,
    tail: 53,
    color1: "#3b82f6",
    color2: "#2563eb",
    pattern: "#93c5fd",
  },
  {
    head: 68,
    tail: 50,
    color1: "#ec4899",
    color2: "#db2777",
    pattern: "#f9a8d4",
  },
  {
    head: 64,
    tail: 60,
    color1: "#14b8a6",
    color2: "#0d9488",
    pattern: "#5eead4",
  },
  {
    head: 62,
    tail: 39,
    color1: "#43a047",
    color2: "#2e7d32",
    pattern: "#1b5e20",
  },
  {
    head: 59,
    tail: 16,
    color1: "#e53935",
    color2: "#c62828",
    pattern: "#ffc107",
  },
  {
    head: 54,
    tail: 28,
    color1: "#8e24aa",
    color2: "#6a1b9a",
    pattern: "#ce93d8",
  },
  {
    head: 45,
    tail: 17,
    color1: "#fb8c00",
    color2: "#ef6c00",
    pattern: "#ffe082",
  },
  {
    head: 35,
    tail: 8,
    color1: "#3949ab",
    color2: "#283593",
    pattern: "#9fa8da",
  },
  { head: 97, tail: 86, color1: "#8b5cf6", color2: "#7c3aed", pattern: "#c4b5fd" },
  { head: 94, tail: 73, color1: "#22c55e", color2: "#16a34a", pattern: "#86efac" },
  { head: 87, tail: 53, color1: "#ef4444", color2: "#dc2626", pattern: "#fca5a5" },
  { head: 81, tail: 63, color1: "#eab308", color2: "#ca8a04", pattern: "#fde047" },
  { head: 76, tail: 48, color1: "#06b6d4", color2: "#0891b2", pattern: "#67e8f9" },
  { head: 69, tail: 33, color1: "#db2777", color2: "#be185d", pattern: "#f9a8d4" },
  { head: 61, tail: 43, color1: "#4f46e5", color2: "#4338ca", pattern: "#a5b4fc" },
  { head: 56, tail: 26, color1: "#10b981", color2: "#059669", pattern: "#6ee7b7" },
  { head: 49, tail: 15, color1: "#d946ef", color2: "#c026d3", pattern: "#f0abfc" },
  { head: 42, tail: 21, color1: "#64748b", color2: "#475569", pattern: "#cbd5e1" },
  { head: 34, tail: 14, color1: "#fb8c00", color2: "#ef6c00", pattern: "#ffe082" },
  { head: 32, tail: 10, color1: "#3949ab", color2: "#283593", pattern: "#9fa8da" },
  { head: 99, tail: 78, color1: "#8b5cf6", color2: "#7c3aed", pattern: "#c4b5fd" },
  { head: 89, tail: 68, color1: "#22c55e", color2: "#16a34a", pattern: "#86efac" },
  { head: 79, tail: 40, color1: "#ef4444", color2: "#dc2626", pattern: "#fca5a5" },
  { head: 66, tail: 37, color1: "#eab308", color2: "#ca8a04", pattern: "#fde047" },
  { head: 52, tail: 28, color1: "#06b6d4", color2: "#0891b2", pattern: "#67e8f9" },
  { head: 47, tail: 16, color1: "#db2777", color2: "#be185d", pattern: "#f9a8d4" }
];

const ladders = [
  { base: 2, top: 38 },
  { base: 9, top: 29 },
  { base: 14, top: 56 },
  { base: 21, top: 42 },
  { base: 28, top: 84 },
  { base: 51, top: 67 },
  { base: 71, top: 91 },
  { base: 78, top: 97 },
];

const treeTiles = [
  5, 12, 19, 25, 31, 38, 44, 50, 55, 60, 65, 72, 79, 85, 91, 98,
  8, 15, 22, 29, 36, 42, 49, 58, 64, 75, 82, 88, 93, 96
];

function getCoords(tileNum: number) {
  const rowFromBottom = Math.floor((tileNum - 1) / 10);
  const row = 9 - rowFromBottom;
  let col = (tileNum - 1) % 10;
  if (rowFromBottom % 2 !== 0) col = 9 - col;
  return { x: col * 100 + 50, y: row * 100 + 50 };
}

interface Question {
  q: string;
  opts: string[];
  ans: number;
}
interface Player {
  id: number;
  uid?: string;
  name: string;
  pos: number;
  color: ColorOpt;
  isCpu?: boolean;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class AudioService {
  ctx: AudioContext | null = null;
  init() {
    if (!this.ctx)
      this.ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  play(type: string) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    if (type === "roll") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "move") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "snake") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === "ladder") {
      osc.type = "square";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "tick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "win") {
      osc.type = "triangle";
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        osc.frequency.setValueAtTime(freq, now + i * 0.2);
      });
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 1);
      osc.start(now);
      osc.stop(now + 1);
    }
  }
}
const audio = new AudioService();

const diceConfig: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

export default function App() {
  const [location, setLocation] = useLocation();
  const [gameState, setGameState] = useState<"setup" | "playing">("setup");
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurn, setCurrentTurn] = useState<number>(0);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const [questionTimerSeconds, setQuestionTimerSeconds] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null);
  const [boardThemeId, setBoardThemeId] = useState<string>("classic");
  const [snakeCount, setSnakeCount] = useState<number | "">(12);
  const [treeCount, setTreeCount] = useState<number | "">(16);

  const activeSnakes = snakes.slice(0, typeof snakeCount === 'number' ? snakeCount : 0);
  const activeTrees = treeTiles.slice(0, typeof treeCount === 'number' ? treeCount : 0);

  const [showTurnPopup, setShowTurnPopup] = useState<boolean>(false);

  // Multiplayer State
  const [user, setUser] = useState<User | null>(null);
  const [isAdminState, setIsAdminState] = useState<boolean>(false);

  useEffect(() => {
    if (gameState === "playing" && players.length > 0) {
      setShowTurnPopup(true);
      const timer = setTimeout(() => setShowTurnPopup(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, gameState, players.length]);

  const [gameId, setGameId] = useState<string | null>(null);
  const [lobbyData, setLobbyData] = useState<Record<string, {name: string, colorIndex: number | null}>>({});
  const [joinCode, setJoinCode] = useState<string>("");
  const [isHost, setIsHost] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  
  const [localPlayerId] = useState(() => {
    let id = localStorage.getItem("localPlayerId");
    if (!id) {
       id = Math.random().toString(36).substring(2, 10);
       localStorage.setItem("localPlayerId", id);
    }
    return id;
  });

  const [roomRequest, setRoomRequest] = useState<{status: string, code: string | null} | null>(null);

  const requestRoomCode = async () => {
    try {
      await setDoc(doc(db, "room_requests", localPlayerId), {
        status: "pending",
        code: null,
        createdAt: Date.now(),
      });
      showMessage("Request Sent", "Your request for a room code has been sent to the admin. Please wait.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "room_requests");
    }
  };

  useEffect(() => {
    if (!localPlayerId) return;
    const unsub = onSnapshot(doc(db, "room_requests", localPlayerId), (snap) => {
        if(snap.exists()) {
           setRoomRequest(snap.data() as any);
        } else {
           setRoomRequest(null);
        }
    });
    return () => unsub();
  }, [localPlayerId]);

  useEffect(() => {
    if (roomRequest?.status === "approved" && roomRequest?.code) {
       const autoJoin = async () => {
         const code = roomRequest.code!;
         try {
           const docRef = doc(db, "games", code);
           const ds = await getDoc(docRef);
           if (ds.exists()) {
             const gameData = ds.data();
             const lobbyData = gameData.lobby || {};
             
             if (Object.keys(lobbyData).length >= 5 && !lobbyData[localPlayerId]) {
                 showMessage("Room Full", "This game already has the maximum of 5 teams.");
                 await deleteDoc(doc(db, "room_requests", localPlayerId));
                 return;
             }

             setGameId(code);
             setIsHost(gameData.hostId === user?.uid);
             setJoinCode(code);
             
             if (!lobbyData[localPlayerId]) {
                await updateDoc(docRef, {
                  [`lobby.${localPlayerId}`]: {
                     name: "Player",
                     colorIndex: null
                  }
                });
             }
             await deleteDoc(doc(db, "room_requests", localPlayerId));
           } else {
             showMessage("Game Not Found", "The assigned room code could not be found.");
             await deleteDoc(doc(db, "room_requests", localPlayerId));
           }
         } catch(e) {
           console.error("Auto-join failed", e);
         }
       };
       autoJoin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomRequest?.status, roomRequest?.code]);

  const [pendingRequests, setPendingRequests] = useState<{id: string, createdAt: number}[]>([]);
  const [pendingAdminRequests, setPendingAdminRequests] = useState<{id: string, email: string, reason: string, createdAt: number}[]>([]);
  const [myAdminRequestStatus, setMyAdminRequestStatus] = useState<{status: string, reason?: string} | null>(null);
  const [adminRequestReason, setAdminRequestReason] = useState("");

  useEffect(() => {
    if (user && !isAdminState) {
        const unsub = onSnapshot(doc(db, "admin_requests", user.uid), (snap) => {
           if (snap.exists()) {
              setMyAdminRequestStatus({
                 status: snap.data()?.status || "pending",
                 reason: snap.data()?.rejectReason
              });
           } else {
              setMyAdminRequestStatus(null);
           }
        });
        return unsub;
    }
  }, [user, isAdminState]);

  const submitAdminRequest = async () => {
    if (!user || !adminRequestReason.trim()) return;
    try {
      await setDoc(doc(db, "admin_requests", user.uid), {
        status: "pending",
        reason: adminRequestReason.trim(),
        email: user.email,
        createdAt: Date.now()
      });
      setAdminRequestReason("");
      showMessage("Request Sent", "Your request to become an admin has been sent.");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "admin_requests");
    }
  };

  const approveAdminRequest = async (uid: string, result: 'approved' | 'rejected', rejectReason?: string) => {
    if (!isAdminState) return;
    try {
      if (result === 'approved') {
         await setDoc(doc(db, "admins", uid), {
            role: "admin",
            createdAt: Date.now()
         });
         await updateDoc(doc(db, "admin_requests", uid), { status: "approved" });
      } else {
         await updateDoc(doc(db, "admin_requests", uid), { status: "rejected", rejectReason: rejectReason || "No reason provided" });
      }
      showMessage("Status Updated", `The request has been ${result}.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "admin_requests");
    }
  };

  useEffect(() => {
    if (!isAdminState) return;
    
    let unsubGames: any;
    
    // Automatically load the latest game session for the admin to supervise
    const q = collection(db, "games");
    unsubGames = onSnapshot(q, (snapshot) => {
      let activeGameId: string | null = null;
      let playingGameId: string | null = null;
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.hostId === user.uid) {
           if (data.gameState === "playing") playingGameId = docSnap.id;
           if (data.gameState === "setup") activeGameId = docSnap.id;
        }
      });
      
      // Prefer playing game over setup game
      const recoveredId = playingGameId || activeGameId;
      if (recoveredId && gameId !== recoveredId) {
         setGameId(recoveredId);
         setIsHost(true);
      }
    });

    const unsub = onSnapshot(collection(db, "room_requests"), (snapshot) => {
        const reqs: any[] = [];
        snapshot.forEach(docSnap => {
            if (docSnap.data().status === "pending") {
                reqs.push({id: docSnap.id, ...docSnap.data()});
            }
        });
        setPendingRequests(reqs.sort((a,b) => b.createdAt - a.createdAt));
    });
    
    const unsubAdminReqs = onSnapshot(collection(db, "admin_requests"), (snapshot) => {
        const reqs: any[] = [];
        snapshot.forEach(docSnap => {
            if (docSnap.data().status === "pending") {
                reqs.push({id: docSnap.id, ...docSnap.data()});
            }
        });
        setPendingAdminRequests(reqs.sort((a,b) => b.createdAt - a.createdAt));
    });
    
    return () => {
       unsub();
       unsubAdminReqs();
       if (unsubGames) unsubGames();
    };
  }, [user, gameId, isAdminState]);

  const approveRoomRequest = async (requestId: string) => {
    if (!user) return;
    try {
      let codeToShare = gameId;
      if (!codeToShare) {
        codeToShare = Math.random().toString(36).substring(2, 8).toUpperCase();
        const initGame = {
          hostId: user.uid,
          gameState: "setup",
          timerMinutes: timerMinutes,
          questionTimerSeconds: questionTimerSeconds,
          startedAt: null,
          currentTurn: 0,
          players: [],
          lobby: {},
          lastEvent: null,
          questionBank: questionBankRef.current,
          questionIndex: 0
        };
        await setDoc(doc(db, "games", codeToShare), initGame);
        setGameId(codeToShare);
        setIsHost(true);
      }
      
      await updateDoc(doc(db, "room_requests", requestId), {
         status: "approved",
         code: codeToShare
      });
      showMessage("Approved", "Code sent to user. You are now supervising this room.");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "room_requests");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      leaderboardRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleCopyCode = () => {
    if (!gameId) return;
    navigator.clipboard.writeText(gameId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };
  const lastProcessedEventRef = useRef<string | null>(null);
  const multiplayerSyncingRef = useRef(false);
  const remoteAnswerResolver = useRef<((val: boolean) => void) | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
       setUser(u);
       if (u) {
          if (u.email === "teachertechsolution@gmail.com") {
             setIsAdminState(true);
          } else {
             try {
                const adminDoc = await getDoc(doc(db, "admins", u.uid));
                setIsAdminState(adminDoc.exists());
             } catch (e) {
                setIsAdminState(false);
             }
          }
       } else {
          setIsAdminState(false);
       }
    });
    return unsub;
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const createGame = async () => {
    if (!user) return;
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initGame = {
      hostId: user.uid,
      gameState: "setup",
      timerMinutes: timerMinutes,
      questionTimerSeconds: questionTimerSeconds,
      startedAt: null,
      currentTurn: 0,
      players: [],
      lobby: {},
      lastEvent: null,
      questionBank: questionBankRef.current,
      questionIndex: 0
    };
    try {
      await setDoc(doc(db, "games", newCode), initGame);
      setGameId(newCode);
      setIsHost(true);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "games");
    }
  };

  const joinSession = async () => {
    if (!joinCode) return;
    
    if (user?.email === "teachertechsolution@gmail.com") {
      showMessage("Admin Account", "You are the Game Master! You cannot join as a player. Use 'Admin Dashboard' to supervise the game.");
      return;
    }

    const code = joinCode.trim().toUpperCase();
    try {
      const docRef = doc(db, "games", code);
      const ds = await getDoc(docRef);
      if (ds.exists()) {
        const gameData = ds.data();
        const lobbyData = gameData.lobby || {};
        
        if (Object.keys(lobbyData).length >= 5 && !lobbyData[localPlayerId]) {
           showMessage("Room Full", "This game already has the maximum of 5 teams.");
           return;
        }

        setGameId(code);
        setIsHost(gameData.hostId === user?.uid);
        
        // Add to lobby if not already there or not host
        if (!lobbyData[localPlayerId]) {
           await updateDoc(docRef, {
             [`lobby.${localPlayerId}`]: {
                name: "Player",
                colorIndex: null
             }
           });
        }
      } else {
        showMessage("Game Not Found", "Please check the room code and try again.");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, "games");
    }
  };

  const updateLobbyItem = async (updates: {name?: string, colorIndex?: number}) => {
    if (!gameId) return;
    const docRef = doc(db, "games", gameId);
    const currentLobby = lobbyData[localPlayerId] || { name: "Player", colorIndex: 0 };
    await updateDoc(docRef, {
      [`lobby.${localPlayerId}`]: { ...currentLobby, ...updates }
    });
  };

  const startMultiplayerGame = async () => {
    if (!gameId || !isHost) return;
    audio.init();
    if (questionBankRef.current.length === 0) {
      alert("Teacher! Please add at least one question in the Teacher Panel first.");
      return;
    }
    const pArr: Player[] = [];
    const usedColors = new Set();
    const lobbyEntries = Object.entries(lobbyData);
    
    if (lobbyEntries.length === 0) {
      alert("At least one team must join before starting the game.");
      return;
    }

    lobbyEntries.forEach(([uid, pData]: [string, any], idx) => {
       const clrIdx = pData.colorIndex !== null ? pData.colorIndex : (idx % 5);
       usedColors.add(clrIdx);
       pArr.push({
         id: idx,
         uid: uid,
         name: pData.name || colors[clrIdx].name,
         pos: 1,
         color: colors[clrIdx],
         isCpu: false,
       });
    });
    
    // Shuffle questions
    const shuffledQ = [...questionBankRef.current].sort(() => Math.random() - 0.5);

    try {
      await updateDoc(doc(db, "games", gameId), {
        gameState: "playing",
        players: pArr,
        startedAt: Date.now(),
        questionBank: shuffledQ,
        questionIndex: 0,
        boardThemeId,
        snakeCount,
        treeCount
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "games");
    }
  };

  // Sync game from Firebase
  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, "games", gameId), async (snapshot) => {
      if (!snapshot.exists()) {
        const wasActive = gameActiveRef.current;
        gameActiveRef.current = false;
        resetGame(true);
        setGameId(null);
        setIsHost(false);
        if (wasActive) {
            alert("This game has been ended by the host.");
        }
        return;
      }
      const data = snapshot.data();
      
      // Sync game active flags
      if (data.gameState === "playing" && !gameActiveRef.current) {
         gameActiveRef.current = true;
         audio.init();
      } else if (data.gameState === "setup" && gameActiveRef.current) {
         gameActiveRef.current = false;
         resetGame(true); // pass true to avoid recursive sync
      }
      if (data.gameState !== gameState) setGameState(data.gameState as any);
      if (data.lobby) setLobbyData(data.lobby);
      if (data.boardThemeId) setBoardThemeId(data.boardThemeId);
      if (data.snakeCount !== undefined) setSnakeCount(data.snakeCount);
      if (data.treeCount !== undefined) setTreeCount(data.treeCount);
      if (data.questionTimerSeconds !== undefined) setQuestionTimerSeconds(data.questionTimerSeconds);
      if (data.startedAt) startedAtRef.current = data.startedAt;

      if (data.startedAt && !timeLeft && data.timerMinutes > 0 && !data.timeUp) {
        // approximate time tracking
         setTimeLeft(data.timerMinutes * 60);
      }

      // Always use the question bank from the active game
      if (data.questionBank) {
        // Only update if it actually changed to prevent infinite re-renders
        if (JSON.stringify(questionBankRef.current) !== JSON.stringify(data.questionBank)) {
          questionBankRef.current = data.questionBank;
          setQuestionBank(data.questionBank);
          availableQRef.current = [...data.questionBank];
        }
      }

      // Sync players
      if (data.players) {
        if (!isMovingRef.current) {
          let posChanged = false;
          data.players.forEach((dp: any) => {
             const lp = playersRef.current.find(px => px.id === dp.id);
             if (lp && lp.pos !== dp.pos) posChanged = true;
          });
          playersRef.current = data.players;
          setPlayers(data.players);
          if (posChanged) audio.play("move");
        }
      }
      if (data.currentTurn !== undefined) setCurrentTurn(data.currentTurn);
      if (data.questionIndex !== undefined) questionIndexRef.current = data.questionIndex;

      // Process remote events (Rolls, etc)
      if (data.lastEvent && data.lastEvent.eventId !== lastProcessedEventRef.current) {
        const ev = data.lastEvent;
        lastProcessedEventRef.current = ev.eventId;
        
        if (ev.type === "ROLL") {
          if (ev.rollerId === localPlayerId) {
             // I already rolled locally
             return;
          }
          const p = playersRef.current.find((x: any) => x.id === ev.playerId);
          if (p && !isMovingRef.current) {
             // Show remote roll dice, NO local execution of executeMove needed
             setDiceVal(ev.rollValue);
             setShowBigDice(true);
             audio.play("dice");
             setTimeout(() => setShowBigDice(false), 2500);
          }
        } else if (ev.type === "TREE") {
            if (ev.playerId !== currentTurn && playersRef.current.find(x => x.uid === localPlayerId)?.id === ev.playerId) return;
            const p = playersRef.current.find((x: any) => x.id === ev.playerId);
            if (p && !isMovingRef.current) {
                 setQModal({ open: true, qData: availableQRef.current[Math.max(0, data.questionIndex - 1)] || availableQRef.current[0] || null, resolve: null, cpName: p.name });
            }
        } else if (ev.type === "ANSWER") {
           if (ev.playerId !== currentTurn && playersRef.current.find(x => x.uid === localPlayerId)?.id === ev.playerId) return;
           const p = playersRef.current.find((x: any) => x.id === ev.playerId);
           if (p && !isMovingRef.current) {
                setQFeedback(ev.correct ? "correct" : "wrong");
                audio.play(ev.correct ? "correct" : "wrong");
                setTimeout(() => {
                    setQFeedback(null);
                    setQModal({ open: false, qData: null, resolve: null });
                }, 2000);
           }
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, "games"));
    return () => unsub();
  }, [gameId, gameState, currentTurn]);

  const gameActiveRef = useRef(false);
  const playersRef = useRef<Player[]>([]);
  const isMovingRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  const [questionBank, setQuestionBank] = useState<Question[]>(() => {
    const saved = localStorage.getItem("teacherQuestions");
    if (saved) return JSON.parse(saved);
    return [
      { q: "What is 2 + 2?", opts: ["3", "4", "5", "6"], ans: 1 },
      { q: "Which planet is known as the Red Planet?", opts: ["Venus", "Mars", "Jupiter", "Saturn"], ans: 1 },
      { q: "What is the capital of France?", opts: ["London", "Berlin", "Paris", "Rome"], ans: 2 }
    ];
  });
  const questionBankRef = useRef<Question[]>(questionBank);
  const availableQRef = useRef<Question[]>([...questionBank]);
  const questionIndexRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem("teacherQuestions", JSON.stringify(questionBank));
  }, [questionBank]);

  const [teacherOpen, setTeacherOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  useEffect(() => {
    if (showHistory && isAdminState) {
      getDocs(collection(db, "game_history")).then(snap => {
        const h = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.completedAt - a.completedAt);
        setGameHistory(h);
      }).catch(e => console.error(e));
    }
  }, [showHistory, isAdminState]);
  const [msgModal, setMsgModal] = useState({
    open: false,
    title: "",
    text: "",
  });
  const [winModal, setWinModal] = useState<{
    open: boolean;
    winner: Player | null;
    timeUp?: boolean;
  }>({ open: false, winner: null, timeUp: false });

  const [qModal, setQModal] = useState<{
    open: boolean;
    qData: Question | null;
    resolve: ((v: boolean) => void) | null;
    cpName?: string;
  }>({ open: false, qData: null, resolve: null });
  const [qFeedback, setQFeedback] = useState<"correct" | "wrong" | null>(null);

  const [diceVal, setDiceVal] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  const [supportOpen, setSupportOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [zoomedQR, setZoomedQR] = useState(false);
  const [showBigDice, setShowBigDice] = useState(false);
  const [localCpuCount, setLocalCpuCount] = useState(1);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("savedLocalGame")) {
      setHasSavedGame(true);
    }
  }, [gameState]);

  const saveLocalGame = () => {
    if (gameActiveRef.current && !gameId) {
      const state = {
        players: playersRef.current,
        currentTurn,
        timeLeft,
        boardThemeId,
        snakeCount,
        treeCount,
        timerMinutes,
        questionTimerSeconds,
        availableQ: availableQRef.current,
        questionIndex: questionIndexRef.current,
      };
      localStorage.setItem("savedLocalGame", JSON.stringify(state));
      setHasSavedGame(true);
    }
  };

  const resumeLocalGame = () => {
    const saved = localStorage.getItem("savedLocalGame");
    if (saved) {
      const state = JSON.parse(saved);
      playersRef.current = state.players;
      setPlayers(state.players);
      setCurrentTurn(state.currentTurn);
      setTimeLeft(state.timeLeft);
      setBoardThemeId(state.boardThemeId);
      setSnakeCount(state.snakeCount);
      setTreeCount(state.treeCount);
      setTimerMinutes(state.timerMinutes);
      setQuestionTimerSeconds(state.questionTimerSeconds);
      availableQRef.current = state.availableQ;
      questionIndexRef.current = state.questionIndex;
      gameActiveRef.current = true;
      setGameState("playing");
      setHasSavedGame(true);
    }
  };

  const [stepCount, setStepCount] = useState<{
    id: number;
    count: number;
  } | null>(null);

  const [tq, setTq] = useState("");
  const [to0, setTo0] = useState("");
  const [to1, setTo1] = useState("");
  const [to2, setTo2] = useState("");
  const [to3, setTo3] = useState("");
  const [tans, setTans] = useState("0");
  const [bulkText, setBulkText] = useState("");
  const [teacherAuth, setTeacherAuth] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const showMessage = async (
    title: string,
    text: string,
    durationMs = 3500,
  ) => {
    setMsgModal({ open: true, title, text });
    await sleep(durationMs);
    setMsgModal((m) => ({ ...m, open: false }));
  };

  useEffect(() => {
    let interval: any;
    if (
      gameState === "playing" &&
      timeLeft !== null &&
      timeLeft > 0 &&
      !winModal.open
    ) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev && prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft, winModal.open]);

  useEffect(() => {
    let interval: any;
    if (
      qModal.open &&
      questionTimeLeft !== null &&
      questionTimeLeft > 0
    ) {
      interval = setInterval(() => {
        setQuestionTimeLeft((prev) => {
          if (prev && prev <= 6 && prev >= 1) {
             audio.init();
             audio.play("tick");
          }
          if (prev && prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [qModal.open, questionTimeLeft]);

  useEffect(() => {
    if (qModal.open && questionTimeLeft === 0 && !qFeedback) {
       // Time up
       if (qModal.resolve) {
          qModal.resolve(false);
       }
    }
  }, [questionTimeLeft, qModal.open, qFeedback, qModal.resolve]);

  useEffect(() => {
    if (timeLeft === 0 && gameState === "playing" && !winModal.open) {
      gameActiveRef.current = false;
      let furthest = playersRef.current[0];
      playersRef.current.forEach((p) => {
        if (p.pos > furthest.pos) furthest = p;
      });
      triggerWin(furthest, true);
    }
  }, [timeLeft, gameState, winModal.open]);

  useEffect(() => {
    if (gameState === "playing" && !winModal.open && gameActiveRef.current) {
      const cp = playersRef.current[currentTurn];
      if (cp?.isCpu && !isRolling && !isMoving && !qModal.open) {
        const timer = setTimeout(() => {
          if (
            gameActiveRef.current &&
            playersRef.current[currentTurn]?.id === cp.id
          ) {
            rollDice();
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [
    currentTurn,
    gameState,
    winModal.open,
    isRolling,
    isMoving,
    qModal.open,
    players,
  ]);

  const handleThemeChange = async (newThemeId: string) => {
    setBoardThemeId(newThemeId);
    if (gameId && user?.email === "teachertechsolution@gmail.com") {
      try {
        await updateDoc(doc(db, "games", gameId), { boardThemeId: newThemeId });
      } catch (e) {
        console.error("Error updating theme ID", e);
      }
    }
  };

  const handleSnakeCountChange = async (val: string) => {
    if (val === "") {
      setSnakeCount("");
      return;
    }
    const count = parseInt(val);
    if (isNaN(count)) return;
    const validCount = Math.max(0, Math.min(30, count));
    setSnakeCount(validCount);
    if (gameId && user?.email === "teachertechsolution@gmail.com") {
      try {
        await updateDoc(doc(db, "games", gameId), { snakeCount: validCount });
      } catch (e) {}
    }
  };

  const handleTreeCountChange = async (val: string) => {
    if (val === "") {
      setTreeCount("");
      return;
    }
    const count = parseInt(val);
    if (isNaN(count)) return;
    const validCount = Math.max(0, Math.min(30, count));
    setTreeCount(validCount);
    if (gameId && user?.email === "teachertechsolution@gmail.com") {
      try {
        await updateDoc(doc(db, "games", gameId), { treeCount: validCount });
      } catch (e) {}
    }
  };

  const addTeacherQuestion = (silent = false) => {
    if (!tq || !to0 || !to1 || !to2 || !to3) {
      if (!silent) alert("Please enter the question and all 4 options.");
      return false;
    }
    const newQ: Question = {
      q: tq,
      opts: [to0, to1, to2, to3],
      ans: parseInt(tans),
    };
    questionBankRef.current = [...questionBankRef.current, newQ];
    setQuestionBank([...questionBankRef.current]);
    availableQRef.current = [...questionBankRef.current].sort(
      () => Math.random() - 0.5,
    );
    if (gameId && isHost) {
      updateDoc(doc(db, "games", gameId), { questionBank: availableQRef.current, questionIndex: 0 }).catch(console.error);
    }
    setTq("");
    setTo0("");
    setTo1("");
    setTo2("");
    setTo3("");
    setTans("0");
    if (!silent) alert("Question added successfully!");
    return true;
  };

  const importBulkQuestions = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const newQuestions: Question[] = [];

    let currentQ = "";
    let opts: string[] = [];
    let ansIdx = 0;

    const saveCurrentQuestion = () => {
      if (currentQ && opts.length >= 2) {
        newQuestions.push({ q: currentQ, opts: [...opts], ans: ansIdx });
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isOption = /^[A-E][.\)]\s*/i.test(line);
      const isAnswer =
        /^Answer:\s*[A-E]/i.test(line) || /^Correct:\s*[A-E]/i.test(line);

      if (isAnswer) {
        const m = line.match(/^(?:Answer|Correct):\s*([A-E])/i);
        if (m && m[1]) {
          const charCode = m[1].toUpperCase().charCodeAt(0);
          ansIdx = charCode - 65;
        }
      } else if (isOption) {
        let optText = line.replace(/^[A-E][.\)]\s*/i, "");
        let isCorrect = false;
        if (optText.startsWith("*")) {
          isCorrect = true;
          optText = optText.substring(1).trim();
        } else if (optText.endsWith("*")) {
          isCorrect = true;
          optText = optText.slice(0, -1).trim();
        }
        if (isCorrect) {
          ansIdx = opts.length;
        }
        opts.push(optText);
      } else {
        // Assume it's a new question
        saveCurrentQuestion();
        currentQ = line.replace(/^(?:Question:|Q:|[0-9]+\.)\s*/i, "").trim();
        opts = [];
        ansIdx = 0;
      }
    }
    saveCurrentQuestion();

    if (newQuestions.length > 0) {
      questionBankRef.current = [...questionBankRef.current, ...newQuestions];
      setQuestionBank([...questionBankRef.current]);
      availableQRef.current = [...questionBankRef.current].sort(
        () => Math.random() - 0.5,
      );
      if (gameId && isHost) {
          updateDoc(doc(db, "games", gameId), { questionBank: availableQRef.current, questionIndex: 0 }).catch(console.error);
      }
      alert(`Imported ${newQuestions.length} questions successfully!`);
      setBulkText("");
    } else {
      alert("Could not parse any questions. Make sure format is correct.");
    }
  };

  const closeTeacherPanel = () => {
    if (tq.trim() !== "") {
      const success = addTeacherQuestion(true);
      if (!success) {
        alert(
          "You have an unfinished question. Fill out all options or clear it.",
        );
        return;
      }
    }
    setTeacherOpen(false);
    setTeacherAuth(false);
    setPinInput("");
    setLocation("/");
  };

  const clearQuestions = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all questions? You'll need to add new ones!",
      )
    ) {
      questionBankRef.current = [];
      setQuestionBank([]);
      availableQRef.current = [];
      if (gameId && isHost) {
          updateDoc(doc(db, "games", gameId), { questionBank: [], questionIndex: 0 }).catch(console.error);
      }
      alert("All questions wiped successfully.");
    }
  };

  const endAllGames = async () => {
    if (
      window.confirm(
        "Are you sure you want to stop and end ALL active games for all players?"
      )
    ) {
      try {
        const querySnapshot = await getDocs(collection(db, "games"));
        const batchPromises = querySnapshot.docs.map(document => 
          deleteDoc(doc(db, "games", document.id))
        );
        await Promise.all(batchPromises);
        alert("All games have been ended.");
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, "games");
      }
    }
  };

  const setMoving = (val: boolean) => {
    isMovingRef.current = val;
    setIsMoving(val);
  };
  const updatePlayerPos = (id: number, pos: number) => {
    playersRef.current = playersRef.current.map((p) =>
      p.id === id ? { ...p, pos } : p,
    );
    setPlayers([...playersRef.current]);
  };

  const startGame = async (humanTeamIndex: number, isMultiplayer = false, cpuCount = 4) => {
    audio.init();
    if (questionBankRef.current.length === 0) {
      alert("Teacher! Please add at least one question in the Teacher Panel first.");
      return;
    }
    availableQRef.current = [...questionBankRef.current].sort(() => Math.random() - 0.5);
    questionIndexRef.current = 0;
    const pArr: Player[] = [];
    const totalPlayers = isMultiplayer ? colors.length : 1 + cpuCount;
    for (let i = 0; i < totalPlayers; i++) {
      pArr.push({
        id: i,
        name: colors[i].name,
        pos: 1,
        color: colors[i],
        isCpu: isMultiplayer ? false : (i !== humanTeamIndex),
      });
    }
    playersRef.current = pArr;
    setPlayers(pArr);
    setCurrentTurn(0);
    gameActiveRef.current = true;
    startedAtRef.current = Date.now();
    if (timerMinutes > 0) setTimeLeft(timerMinutes * 60);
    else setTimeLeft(null);
    setGameState("playing");
    setMoving(false);

    if (isMultiplayer && isHost && gameId) {
      try {
        await updateDoc(doc(db, "games", gameId), {
          gameState: "playing",
          startedAt: Date.now(),
          players: pArr,
          currentTurn: 0,
          timerMinutes,
          questionTimerSeconds,
          questionBank: questionBankRef.current,
          boardThemeId,
          snakeCount,
          treeCount
        });
      } catch (e) {
        console.error("Error starting multiplayer", e);
      }
    }
  };

  const resetGame = async (fromRemote = false) => {
    gameActiveRef.current = false;
    setMoving(false);
    playersRef.current = [];
    setPlayers([]);
    setCurrentTurn(0);
    setTimeLeft(null);
    if (qModal.resolve) qModal.resolve(false);
    setQModal({ open: false, qData: null, resolve: null });
    setQFeedback(null);
    setStepCount(null);
    setGameState("setup");
    setWinModal({ open: false, winner: null, timeUp: false });
    setMsgModal({ open: false, title: "", text: "" });
    setIsRolling(false);
    if (gameId && isHost && !fromRemote) {
       try {
         await updateDoc(doc(db, "games", gameId), { gameState: "setup", players: [] });
       } catch (e) {}
    }
  };

  const promptQuestion = (mode: "human" | "cpu" | "remote", cpName?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let qData = availableQRef.current[questionIndexRef.current];
      
      if (!qData) {
        if (questionBankRef.current.length === 0) {
           resolve(true); 
           return;
        }
        availableQRef.current = [...questionBankRef.current].sort(() => Math.random() - 0.5);
        questionIndexRef.current = 0;
        qData = availableQRef.current[0];
        if (gameId && (isHost || mode === "human")) {
            updateDoc(doc(db, "games", gameId), { questionBank: availableQRef.current, questionIndex: 0 }).catch(console.error);
        }
      }

      const currentQData = qData;
      
      if (mode !== "remote") {
        questionIndexRef.current += 1;
        if (gameId && !multiplayerSyncingRef.current) {
          updateDoc(doc(db, "games", gameId), {
             questionIndex: questionIndexRef.current,
             lastEvent: { eventId: Math.random().toString(36).substring(7), type: "TREE", playerId: currentTurn, timestamp: Date.now() }
          }).catch(e => console.error(e));
        }
      }

      const finishQuestion = async (correct: boolean) => {
          setQuestionTimeLeft(null);
          setQFeedback(correct ? "correct" : "wrong");
          audio.play(correct ? "correct" : "wrong");
          await sleep(2000);
          if (gameActiveRef.current) {
              setQModal({ open: false, qData: null, resolve: null });
              setQFeedback(null);
          }
          resolve(correct);
      };

      if (mode === "human") {
          setQModal({ open: true, qData: currentQData, resolve: finishQuestion, cpName });
          if (questionTimerSeconds > 0) {
              setQuestionTimeLeft(questionTimerSeconds);
          }
      } else if (mode === "cpu") {
          setQModal({ open: true, qData: currentQData, resolve: null, cpName });
          setTimeout(() => {
              const correct = Math.random() > 0.4;
              finishQuestion(correct);
          }, 3000);
      } else if (mode === "remote") {
          setQModal({ open: true, qData: currentQData, resolve: null, cpName });
          remoteAnswerResolver.current = finishQuestion;
      }
    });
  };

  const handleAnswerClick = async (index: number) => {
    if (!qModal.qData || !qModal.resolve || qFeedback) return;
    const correct = index === qModal.qData.ans;
    qModal.resolve(correct); // delegate to finishQuestion
  };

  const rollDice = async () => {
    if (isMovingRef.current || !gameActiveRef.current) return;
    
    // Calculate roll centrally
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const roll = (randomBuffer[0] % 6) + 1;

    if (gameId && !multiplayerSyncingRef.current) {
       try {
         const eventId = Math.random().toString(36).substring(7);
         await updateDoc(doc(db, "games", gameId), {
           lastEvent: { eventId, type: "ROLL", playerId: currentTurn, rollValue: roll, timestamp: Date.now(), rollerId: localPlayerId }
         });
       } catch (e) {
         console.error(e);
       }
    }

    audio.init();
    setMoving(true);
    setIsRolling(true);
    setShowBigDice(true);
    
    for (let i = 0; i < 15; i++) {
       if (!gameActiveRef.current) return;
       const rBuf = new Uint32Array(1);
       window.crypto.getRandomValues(rBuf);
       setDiceVal((rBuf[0] % 6) + 1);
       if (i % 3 === 0) audio.play("roll");
       await sleep(60);
    }
    
    if (!gameActiveRef.current) return;
    setDiceVal(roll);
    setIsRolling(false);

    await sleep(1000);
    setShowBigDice(false);

    const p = playersRef.current[currentTurn];
    await executeMove(p, roll);
  };

  const triggerWin = (player: Player, timeUp = false) => {
    if (!gameActiveRef.current && !timeUp) return;
    if (!multiplayerSyncingRef.current) audio.play("win");
    gameActiveRef.current = false;
    setWinModal({ open: true, winner: player, timeUp });

    if (!gameId) {
       localStorage.removeItem("savedLocalGame");
       setHasSavedGame(false);
    }

    if (isHost || !gameId) {
      const durationMinutes = Math.round((Date.now() - (startedAtRef.current || Date.now())) / 60000);
      const historyEntry = {
        winner: player.name || `Team ${player.id + 1}`,
        winnerColor: player.color.hex,
        durationMinutes: durationMinutes,
        completedAt: Date.now(),
        players: playersRef.current.map(x => ({
           name: x.name || `Team ${x.id + 1}`,
           pos: x.pos,
           color: x.color.hex
        }))
      };
      import("firebase/firestore").then(({ addDoc, collection }) => {
        addDoc(collection(db, "game_history"), historyEntry).catch(e => console.error("History saving failed:", e));
      });
    }
  };

  const executeMove = async (player: Player, roll: number) => {
    let pId = player.id;
    let p = playersRef.current.find((x) => x.id === pId)!;
    let targetPos = Math.min(MAX_TILE, p.pos + roll);

    await sleep(500);

    for (let i = p.pos + 1; i <= targetPos; i++) {
      if (!gameActiveRef.current) return;
      setStepCount({ id: pId, count: i });
      updatePlayerPos(pId, i);
      if (!multiplayerSyncingRef.current) audio.play("move");
      await sleep(500); // Perfect, clear counting steps mapped to 0.4s transition
    }
    setStepCount(null);

    if (!gameActiveRef.current) return;
    p = playersRef.current.find((x) => x.id === pId)!;
    if (p.pos === MAX_TILE) {
      triggerWin(p);
      if (gameId && !multiplayerSyncingRef.current) {
         updateDoc(doc(db, "games", gameId), {
           players: playersRef.current,
           gameState: "finished"
         });
      }
      return;
    }

    await evaluateTile(pId);
    if (!gameActiveRef.current) return;

    const all = playersRef.current;
    if (all.every((x) => x.pos < MAX_TILE)) {
      const nextTurn = (currentTurn + 1) % all.length;
      setCurrentTurn(nextTurn);
      setMoving(false);

      if (gameId && !multiplayerSyncingRef.current) {
         updateDoc(doc(db, "games", gameId), {
           players: playersRef.current,
           currentTurn: nextTurn
         });
      }
    }
  };

  const evaluateTile = async (pId: number, depth = 0) => {
    if (depth > 2) return;
    let p = playersRef.current.find((x) => x.id === pId)!;

    const snake = activeSnakes.find((s) => s.head === p.pos);
    if (snake) {
      if (!multiplayerSyncingRef.current) {
        await showMessage(
          "Oh no! 🐍",
          `A snake bit you! Slide down to tile ${snake.tail}.`,
        );
      }
      if (!gameActiveRef.current) return;
      if (!multiplayerSyncingRef.current) audio.play("snake");
      for (let i = p.pos - 1; i >= snake.tail; i--) {
        if (!gameActiveRef.current) return;
        updatePlayerPos(pId, i);
        if (!multiplayerSyncingRef.current) audio.play("move");
        await sleep(50);
      }
      return evaluateTile(pId, depth + 1);
    }

    const ladder = ladders.find((l) => l.base === p.pos);
    if (ladder) {
      if (!multiplayerSyncingRef.current) {
        await showMessage(
          "Awesome! 🪜",
          `Climb the ladder up to tile ${ladder.top}!`,
        );
      }
      if (!gameActiveRef.current) return;
      if (!multiplayerSyncingRef.current) audio.play("ladder");
      for (let i = p.pos + 1; i <= ladder.top; i++) {
        if (!gameActiveRef.current) return;
        updatePlayerPos(pId, i);
        if (!multiplayerSyncingRef.current) audio.play("move");
        await sleep(50);
      }
      return evaluateTile(pId, depth + 1);
    }

    if (activeTrees.includes(p.pos)) {
      await sleep(400);
      if (!gameActiveRef.current) return;

      let answeredCorrectly = false;
      const cp = playersRef.current.find((x) => x.id === pId)!;

      if (gameId) {
          answeredCorrectly = await promptQuestion(cp.isCpu ? "cpu" : "human", cp.name);
          if (!gameActiveRef.current) return;
          await updateDoc(doc(db, "games", gameId), {
            lastEvent: { eventId: Math.random().toString(36).substring(7), type: "ANSWER", playerId: pId, correct: answeredCorrectly, timestamp: Date.now() }
          });
      } else {
         answeredCorrectly = await promptQuestion(cp.isCpu ? "cpu" : "human", cp.name);
      }

      if (!gameActiveRef.current) return;

      p = playersRef.current.find((x) => x.id === pId)!;
      if (answeredCorrectly) {
        let newPos = Math.min(MAX_TILE, p.pos + 3);
        for (let i = p.pos + 1; i <= newPos; i++) {
          if (!gameActiveRef.current) return;
          setStepCount({ id: pId, count: i });
          updatePlayerPos(pId, i);
          if (!multiplayerSyncingRef.current) audio.play("move");
          await sleep(500);
        }
        setStepCount(null);
      } else {
        updatePlayerPos(pId, Math.max(1, p.pos - 1));
        if (!multiplayerSyncingRef.current) audio.play("move");
        await sleep(500);
      }

      if (!gameActiveRef.current) return;
      p = playersRef.current.find((x) => x.id === pId)!;
      if (p.pos === MAX_TILE) {
        triggerWin(p);
        if (gameId && !multiplayerSyncingRef.current) {
           updateDoc(doc(db, "games", gameId), {
             players: playersRef.current,
             gameState: "finished"
           });
        }
        return;
      }

      return evaluateTile(pId, depth + 1);
    }
  };

  const boardColors = ["#81c784", "#fff59d", "#ffab91", "#80deea", "#b39ddb"];

  if (location === "/admin") {
    return (
      <div className="h-[100dvh] w-full bg-slate-900 flex flex-col p-4 sm:p-6 lg:p-8 font-sans border-t-[6px] sm:border-t-8 border-indigo-500 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 relative h-full min-h-0">
          <button
            onClick={closeTeacherPanel}
            className="absolute -top-2 -right-2 sm:top-0 sm:right-0 text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full shadow-lg z-10"
          >
            <X size={24} className="sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-2 shrink-0 justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                <Settings className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Game Control Center</h2>
                <p className="text-indigo-300 font-medium text-sm sm:text-base mt-1">Supervise the game remotely</p>
              </div>
            </div>
            {user && isAdminState && (
               <button
                 onClick={() => setShowHistory(!showHistory)}
                 className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors font-bold text-sm"
               >
                 <Clock size={16} />
                 {showHistory ? "Back to Dashboard" : "Game History"}
               </button>
            )}
          </div>

          {(!user || !isAdminState) ? (
            <div className="bg-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center border border-slate-700 shadow-2xl mt-10 max-w-md mx-auto w-full shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mb-3 text-center tracking-wide">
                Admin Access Only
              </h3>
              <p className="text-slate-400 text-sm mb-6 text-center leading-relaxed">
                You must be an approved admin to access the master controls.
              </p>
              
              {!user ? (
                <button
                  onClick={login}
                  className="w-full bg-white hover:bg-slate-200 text-slate-900 font-black py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                  Sign in with Google
                </button>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <div className="mb-6 bg-slate-900/50 border-l-4 border-slate-500 text-slate-300 px-4 py-3 rounded-r-lg text-xs font-medium w-full text-center">
                    Logged in as <span className="font-bold text-white">{user.email}</span>
                  </div>
                  
                  {myAdminRequestStatus?.status === "pending" ? (
                    <div className="w-full bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-4 text-center">
                      <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                      <h4 className="text-yellow-400 font-bold mb-1">Request Pending</h4>
                      <p className="text-xs text-yellow-200/70">The main admin is reviewing your request.</p>
                    </div>
                  ) : myAdminRequestStatus?.status === "rejected" ? (
                    <div className="w-full bg-red-500/20 border-2 border-red-500/50 rounded-xl p-4 text-center">
                      <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <h4 className="text-red-400 font-bold mb-1">Request Rejected</h4>
                      <p className="text-xs text-red-200/70 mb-2">Your request to become an admin was declined.</p>
                      {myAdminRequestStatus.reason && (
                         <div className="bg-red-900/50 p-2 rounded-lg text-red-200 text-xs italic mb-2">
                           "{myAdminRequestStatus.reason}"
                         </div>
                      )}
                       <button onClick={() => setMyAdminRequestStatus(null)} className="mt-3 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 py-1 px-3 rounded-lg transition-colors">Apply Again</button>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-900 rounded-xl p-4 border border-slate-700">
                      <h4 className="text-sm font-bold text-slate-300 mb-2">Request Admin Access</h4>
                      <textarea 
                        value={adminRequestReason}
                        onChange={(e) => setAdminRequestReason(e.target.value)}
                        placeholder="Why do you need admin access?" 
                        className="w-full bg-slate-800 border border-slate-700 text-sm text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 min-h-[80px] mb-3 resize-none"
                      />
                      <button 
                        onClick={submitAdminRequest}
                        disabled={!adminRequestReason.trim()}
                        className={`w-full font-bold py-2 rounded-lg transition-colors text-sm ${adminRequestReason.trim() ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-slate-700 text-slate-500 cursor-not-allowed"}`}
                      >
                        Submit Request
                      </button>
                    </div>
                  )}
                  
                  <button onClick={() => {auth.signOut(); setUser(null);}} className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-6 underline underline-offset-4">
                     Sign out
                  </button>
                </div>
              )}
            </div>
          ) : showHistory ? (
            <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <h3 className="text-xl font-black mb-6 text-white tracking-tight flex items-center gap-3">
                <Clock className="text-indigo-400" /> Game History ({gameHistory.length})
              </h3>
              {gameHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-4">
                   <Clock size={48} className="opacity-20" />
                   <p className="font-bold">No completed games found yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gameHistory.map((game, i) => (
                    <div key={game.id || i} className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col">
                      <div className="absolute top-0 left-0 w-full h-2" style={{backgroundColor: game.winnerColor || '#6366f1'}}></div>
                      <div className="flex items-center justify-between mb-4 mt-2">
                        <span className="font-black text-white text-lg">{game.winner || 'Unknown'}</span>
                        <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-1 rounded">WINNER</span>
                      </div>
                      
                      <div className="flex gap-4 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                         <div><span className="text-slate-500 block text-[9px] mb-0.5">Duration</span>{game.durationMinutes || '< 1'} min</div>
                         <div><span className="text-slate-500 block text-[9px] mb-0.5">Date</span>{game.completedAt ? new Date(game.completedAt).toLocaleDateString() : 'Unknown'}</div>
                      </div>

                      <div className="flex flex-col gap-2 mt-auto">
                        <h4 className="text-[10px] uppercase font-bold text-slate-500 px-1">Player Stats</h4>
                        <div className="bg-slate-800/50 rounded-xl p-2 max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 border border-slate-700/50">
                           {game.players && [...game.players].sort((a: any, b: any) => b.pos - a.pos).map((p: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                 <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: p.color}}></div>
                                    <span className="text-slate-300 font-bold">{p.name} {idx === 0 && <span className="text-amber-400 ml-1">👑</span>}</span>
                                 </div>
                                 <span className="text-slate-400 font-black">Tile {p.pos}</span>
                              </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 lg:shrink flex-1 min-h-0 overflow-y-auto lg:overflow-visible">
              
              {/* LEFT COLUMN: Setup & Questions */}
              <div className="lg:col-span-1 flex flex-col gap-6 lg:overflow-y-auto lg:pr-2 custom-scrollbar">
                <div className="bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-xl flex flex-col shrink-0">
                  <h3 className="text-sm font-black mb-4 text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Question Bank
                  </h3>
                  
                  <div className="flex gap-3 mb-5">
                    <div className="bg-slate-900 rounded-xl py-3 px-4 flex-1 border border-slate-700 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-indigo-400">{questionBank.length}</span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-bold">Loaded</span>
                    </div>
                    <button
                      onClick={clearQuestions}
                      title="Wipe All Questions"
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl px-4 text-xs font-black uppercase tracking-wider transition-colors flex flex-col items-center justify-center p-2"
                    >
                      <X size={20} className="mb-1" />
                      Wipe All
                    </button>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 mb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest flex flex-col gap-4">
                    <div>
                      <h4 className="mb-3">Game Timer</h4>
                      <select
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(parseInt(e.target.value))}
                        className="w-full p-3 border border-slate-600 rounded-xl text-sm bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none cursor-pointer"
                      >
                        <option value="0">No Timer (Infinite)</option>
                        <option value="2">2 Minutes</option>
                        <option value="3">3 Minutes</option>
                        <option value="4">4 Minutes</option>
                        <option value="5">5 Minutes</option>
                        <option value="10">10 Minutes</option>
                      </select>
                    </div>
                    <div>
                      <h4 className="mb-3">Question Timer</h4>
                      <select
                        value={questionTimerSeconds}
                        onChange={(e) => setQuestionTimerSeconds(parseInt(e.target.value))}
                        className="w-full p-3 border border-slate-600 rounded-xl text-sm bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none cursor-pointer"
                      >
                        <option value="0">No Timer</option>
                        <option value="10">10 Seconds</option>
                        <option value="15">15 Seconds</option>
                        <option value="20">20 Seconds</option>
                        <option value="30">30 Seconds</option>
                        <option value="60">60 Seconds</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 mb-5">
                    <h4 className="text-[10px] font-black mb-3 text-slate-400 uppercase tracking-widest">
                      Board Theme
                    </h4>
                    <select
                      value={boardThemeId}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="w-full p-3 border border-slate-600 rounded-xl text-sm bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold appearance-none cursor-pointer"
                    >
                      {boardThemes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-1 mt-2">
                       {(boardThemes.find(t => t.id === boardThemeId)?.colors || []).map((c, i) => (
                         <div key={i} className="flex-1 h-2 rounded-full" style={{ backgroundColor: c }}></div>
                       ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 mb-5">
                    <h4 className="text-[10px] font-black mb-3 text-slate-400 uppercase tracking-widest">
                      Board Elements
                    </h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Snakes (Max 30)</label>
                        <input type="number" min="0" max="30" value={snakeCount} onChange={(e) => handleSnakeCountChange(e.target.value)} className="w-full p-2 border border-slate-600 rounded-lg text-sm bg-slate-800 text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Trees (Max 30)</label>
                        <input type="number" min="0" max="30" value={treeCount} onChange={(e) => handleTreeCountChange(e.target.value)} className="w-full p-2 border border-slate-600 rounded-lg text-sm bg-slate-800 text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
                    <h4 className="text-[10px] font-black mb-3 text-indigo-400 uppercase tracking-widest">
                      Add New Question
                    </h4>
                    <input
                      type="text"
                      value={tq}
                      onChange={(e) => setTq(e.target.value)}
                      placeholder="Type the question here..."
                      className="w-full p-3 mb-3 border border-slate-600 rounded-xl text-sm bg-slate-800 text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 shadow-inner"
                    />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[to0, to1, to2, to3].map((val, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={val}
                          onChange={(e) => {
                            if (idx === 0) setTo0(e.target.value);
                            if (idx === 1) setTo1(e.target.value);
                            if (idx === 2) setTo2(e.target.value);
                            if (idx === 3) setTo3(e.target.value);
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="w-full p-2.5 border border-slate-600 rounded-lg text-xs bg-slate-800 text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <select
                        value={tans}
                        onChange={(e) => setTans(e.target.value)}
                        className="flex-1 p-3 border border-slate-600 rounded-xl text-xs sm:text-sm bg-slate-800 text-white focus:outline-none focus:border-indigo-500 font-bold appearance-none"
                      >
                        <option value="0">Correct: Opt 1</option>
                        <option value="1">Correct: Opt 2</option>
                        <option value="2">Correct: Opt 3</option>
                        <option value="3">Correct: Opt 4</option>
                      </select>
                      <button
                        onClick={() => addTeacherQuestion(false)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black py-3 px-5 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] uppercase tracking-wider"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Bulk Import
                      </h4>
                      <a href="/100_questions.txt" download className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold underline">
                        Download Sample (100 Qs)
                      </a>
                    </div>
                    <p className="text-[9px] text-slate-500 mb-2 font-semibold leading-relaxed">
                      Format: <br/>Question 1<br/>A. Option 1<br/>B. Option 2<br/>Answer: A
                    </p>
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="Paste your questions here..."
                      className="w-full flex-1 min-h-[60px] p-2 mb-2 border border-slate-600 rounded-xl text-xs bg-slate-800 text-white focus:outline-none focus:border-indigo-500 shadow-inner resize-none"
                    />
                    <button
                      onClick={importBulkQuestions}
                      className="w-full shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] sm:text-sm font-black py-2 rounded-xl transition-all shadow-sm hover:shadow-md uppercase tracking-wider"
                    >
                      Import Questions
                    </button>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <button
                      onClick={endAllGames}
                      className="w-full bg-red-600/90 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      Force End All Games
                    </button>
                  </div>
                </div>

                {/* GAME RULES CARD */}
                <div className="bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-xl flex flex-col shrink-0">
                  <h3 className="text-sm font-black mb-4 text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2 shrink-0">
                    <BookOpen size={16} /> Game Rules
                  </h3>
                  <div className="text-[11px] text-slate-400 space-y-3 leading-relaxed">
                    <p><strong className="text-slate-200">Objective:</strong> Race against others to be the first to reach the final tile (100).</p>
                    <p><strong className="text-slate-200">Snakes:</strong> If you land on the head of a snake, you will slide down to its tail.</p>
                    <p><strong className="text-slate-200">Ladders:</strong> If you land at the base of a ladder, you will climb up to its top.</p>
                    <p><strong className="text-slate-200">Trees (Questions):</strong> Landing on a tree prompts a multiple-choice question from the Question Bank. You must answer it correctly to proceed safely!</p>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Live Dashboard & Ranking & Requests */}
              <div className="lg:col-span-2 flex flex-col gap-6 lg:overflow-y-auto lg:pr-2 custom-scrollbar">

                {/* ADMIN REQUESTS PANEL */}
                {user?.email === "teachertechsolution@gmail.com" && pendingAdminRequests.length > 0 && (
                  <div className="bg-slate-800 rounded-3xl p-5 sm:p-6 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <h3 className="text-sm font-black text-amber-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                       Admin Access Requests ({pendingAdminRequests.length})
                    </h3>
                    <div className="flex flex-col gap-3">
                       {pendingAdminRequests.map(req => (
                          <div key={req.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col gap-3">
                             <div className="flex justify-between items-start">
                               <div>
                                 <p className="text-sm font-bold text-slate-300">Admin Request</p>
                                 <p className="text-xs text-slate-400">{req.email}</p>
                                 <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{new Date(req.createdAt).toLocaleTimeString()}</p>
                               </div>
                               <button
                                 onClick={() => approveAdminRequest(req.id, 'approved')}
                                 className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-4 rounded-lg transition-colors uppercase tracking-wider"
                               >
                                 Approve Admin
                               </button>
                             </div>
                             <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Reason:</p>
                               <p className="text-sm text-slate-300 italic">"{req.reason}"</p>
                             </div>
                             <div className="flex gap-2">
                                <input
                                   type="text"
                                   placeholder="Reason for Rejection (if any)"
                                   id={`reject-reason-${req.id}`}
                                   className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-red-500"
                                />
                                <button
                                  onClick={() => {
                                     const input = document.getElementById(`reject-reason-${req.id}`) as HTMLInputElement;
                                     approveAdminRequest(req.id, 'rejected', input?.value);
                                  }}
                                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider"
                                >
                                  Reject
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* ROOM REQUESTS PANEL */}
                {pendingRequests.length > 0 && (
                  <div className="bg-slate-800 rounded-3xl p-5 sm:p-6 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <h3 className="text-sm font-black text-indigo-300 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                       Room Requests ({pendingRequests.length})
                    </h3>
                    <div className="flex flex-col gap-3">
                       {pendingRequests.map(req => (
                          <div key={req.id} className="bg-slate-900 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
                             <div>
                               <p className="text-sm font-bold text-slate-300">Player requested access</p>
                               <p className="text-[10px] text-slate-500 uppercase tracking-wider">{new Date(req.createdAt).toLocaleTimeString()}</p>
                             </div>
                             <button
                               onClick={() => approveRoomRequest(req.id)}
                               className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-2 px-4 rounded-lg transition-colors uppercase tracking-wider"
                             >
                               Approve & Create Room
                             </button>
                          </div>
                       ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-xl flex-1 flex flex-col">
                  
                  <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4 mb-6">
                    <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Game Status
                    </h3>
                  </div>

                  {!gameId && players.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl p-10 mt-4 min-h-[300px]">
                      <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      <p className="font-bold text-lg mb-2 text-slate-300">No Game Running</p>
                      <button onClick={createGame} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] uppercase tracking-widest text-sm">
                         Create Game Session
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 flex-1">
                      
                      {/* Connection Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 flex flex-col relative group">
                           <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Room Code</span>
                           <div className="flex items-center gap-2">
                             <span className="text-lg font-black text-white font-mono tracking-widest">{gameId || "LOCAL"}</span>
                             {gameId && (
                               <button 
                                 onClick={handleCopyCode} 
                                 className="text-slate-400 hover:text-white transition-colors"
                                 title="Copy Room Code"
                               >
                                 {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                               </button>
                             )}
                           </div>
                         </div>
                         <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 flex flex-col">
                           <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">State</span>
                           <span className="text-lg font-black text-emerald-400 capitalize">{gameState}</span>
                         </div>
                         <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 flex flex-col">
                           <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Teams</span>
                           <span className="text-lg font-black text-white">{players.length || Object.keys(lobbyData).length}</span>
                         </div>
                         <div className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 flex flex-col">
                           <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Time Left</span>
                           <span className="text-lg font-black text-amber-400">
                             {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}` : "∞"}
                           </span>
                         </div>
                      </div>

                      {/* Current Turn & Lobbies */}
                      {gameState === "setup" && gameId && (
                        <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-700">
                           <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-3 tracking-widest">Players in Lobby waiting to start:</h4>
                           {Object.keys(lobbyData).length > 0 ? (
                             <div className="flex gap-2 flex-wrap mb-4">
                               {Object.values(lobbyData).map((p: any, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-600 shadow-sm">
                                     <div className="w-3 h-3 rounded-full shadow-inner" style={{backgroundColor: p.colorIndex !== null ? Object.values(colors)[p.colorIndex].hex : '#cbd5e1'}}></div>
                                     <span className="text-xs font-bold text-slate-200">{p.name}</span>
                                  </div>
                               ))}
                             </div>
                           ) : (
                             <p className="text-xs text-slate-500 italic mb-4">Waiting for players to join with code {gameId}...</p>
                           )}
                           
                           <button
                             onClick={startMultiplayerGame}
                             disabled={Object.keys(lobbyData).length === 0}
                             className={`w-full font-black py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-wider text-xs sm:text-sm ${Object.keys(lobbyData).length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'}`}
                           >
                             Force Start Game
                           </button>
                        </div>
                      )}

                      {/* REALTIME RANKING */}
                      {players.length > 0 && (
                         <div ref={leaderboardRef} className={`flex flex-col rounded-2xl border p-1 sm:p-5 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 p-6 sm:p-10 pt-12 overflow-y-auto w-full h-full bg-gradient-to-b from-sky-100 to-blue-200 border-none rounded-none text-slate-900' : 'flex-1 bg-slate-900 border-slate-700 text-white'}`}>
                           <div className="flex items-center justify-between mb-4 px-3 sm:px-0 pt-3 sm:pt-0">
                             <h4 className={`font-black uppercase tracking-widest ${isFullscreen ? 'text-3xl sm:text-4xl lg:text-5xl text-center text-sky-900 flex-1 drop-shadow-sm' : 'text-slate-400 text-[10px]'}`}>
                               Live Leaderboard
                             </h4>
                             <button
                               onClick={toggleFullscreen}
                               className={`transition-colors p-2 rounded-lg ml-2 ${isFullscreen ? 'bg-black/10 text-slate-800 hover:bg-black/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                               title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Leaderboard"}
                             >
                               {isFullscreen ? <Minimize size={isFullscreen ? 32 : 16} /> : <Maximize size={16} />}
                             </button>
                           </div>
                           
                           <div className={`flex flex-col gap-2 ${isFullscreen ? 'max-w-7xl mx-auto w-full flex-1 justify-center relative' : ''}`}>
                             {[...players]
                               .sort((a, b) => b.pos - a.pos)
                               .map((p, idx) => (
                               <div key={p.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border shadow-sm relative overflow-visible transition-all duration-500 ${isFullscreen ? 'p-6 sm:p-8 lg:p-10 bg-white/80 border-white shadow-xl backdrop-blur-md mb-2 sm:mb-4' : (idx === 0 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800 border-slate-700')}`}>
                                 
                                 {/* Progress Bar background (Water) */}
                                 <div 
                                    className={`absolute left-0 top-0 bottom-0 z-0 transition-all duration-1000 ease-out border-r-2 ${isFullscreen ? 'bg-gradient-to-r from-sky-300/40 to-blue-400/60 border-blue-400 rounded-xl' : 'bg-gradient-to-t from-blue-500/40 to-cyan-300/10 border-cyan-300/50'}`}
                                    style={{ width: `${(p.pos / 100) * 100}%` }}
                                 >
                                     <div className={`absolute bottom-0 w-full h-1/2 rounded-t-full blur-md animate-pulse ${isFullscreen ? 'bg-blue-300/30' : 'bg-blue-400/20'}`}></div>
                                 </div>

                                 {/* Duck Avatar swimming */}
                                 <div 
                                    className="absolute top-1/2 -translate-y-1/2 z-0 transition-all duration-1000 ease-out flex items-center justify-center pointer-events-none"
                                    style={{ left: `calc(${(p.pos / 100) * 100}% - ${isFullscreen ? '60px' : '24px'})` }}
                                 >
                                    <div className="animate-[bounce_2s_infinite] relative" style={{ filter: `drop-shadow(0 4px 6px ${p.color.hex}80)` }}>
                                      <div className={`transform scale-x-[-1] transition-all duration-300 ${isFullscreen ? 'text-[5rem] sm:text-[6rem] lg:text-[8rem]' : 'text-3xl'}`} style={{ clipPath: 'inset(0 0 28% 0)' }}>
                                        🦆
                                      </div>
                                      {/* Little water ripple under duck */}
                                      <div className={`absolute bottom-[20%] left-1/2 -translate-x-1/2 w-full h-2 rounded-full blur-[2px] animate-pulse ${isFullscreen ? 'bg-white/60' : 'bg-cyan-200/50'}`}></div>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-3 sm:gap-4 z-10 relative pointer-events-none">
                                   <div className={`rounded-full flex items-center justify-center font-black relative border ${isFullscreen ? 'w-16 h-16 sm:w-20 sm:h-20 text-3xl sm:text-4xl shadow-md border-4' : 'w-8 h-8 text-sm'} ${idx === 0 ? (isFullscreen ? 'bg-amber-400 text-amber-900 border-white' : 'bg-amber-400 text-amber-900 border-amber-300') : (isFullscreen ? 'bg-slate-200 text-slate-800 border-white' : 'bg-slate-700 text-slate-300 border-slate-600')}`}>
                                     {idx + 1}
                                     <div className={`absolute rounded-full shadow-inner ${isFullscreen ? '-bottom-1.5 -right-1.5 w-6 h-6 border-[3px] border-white' : '-bottom-1 -right-1 w-3.5 h-3.5 border-2 border-slate-800'}`} style={{backgroundColor: p.color.hex}}></div>
                                   </div>
                                   <span className={`font-black drop-shadow-sm py-1 px-2 sm:px-3 rounded-lg ${isFullscreen ? 'text-3xl sm:text-4xl lg:text-5xl bg-white/50 text-slate-800 shadow-sm border border-white/60' : 'text-sm sm:text-base text-white bg-black/20'}`}>{p.name || `Team ${p.id+1}`} {p.isCpu ? '(CPU)' : ''}</span>
                                 </div>
                                 <div className="z-10 relative flex items-center gap-4 sm:gap-6 pointer-events-none">
                                    {currentTurn === p.id && gameState === "playing" && (
                                       <span className={`font-black uppercase tracking-widest animate-pulse hidden sm:block ${isFullscreen ? 'text-lg sm:text-2xl px-6 py-3 rounded-xl bg-emerald-500 text-white shadow-lg border-2 border-emerald-400' : 'text-[10px] text-emerald-400 bg-emerald-900/60 px-2 py-1 rounded-md'}`}>
                                         Current Turn
                                       </span>
                                    )}
                                    <div className={`flex flex-col items-end py-1 sm:py-2 px-3 sm:px-5 rounded-xl ${isFullscreen ? 'bg-sky-100/80 border border-sky-200 shadow-inner' : 'bg-black/20'}`}>
                                      <span className={`font-black leading-none ${isFullscreen ? 'text-5xl sm:text-6xl text-sky-800 drop-shadow-sm' : 'text-lg text-indigo-300'}`}>{p.pos}</span>
                                      <span className={`font-bold uppercase tracking-wider ${isFullscreen ? 'text-sm sm:text-lg text-sky-600/80 mt-1' : 'text-[9px] text-slate-400'}`}>Tile</span>
                                    </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                      )}

                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full relative flex flex-col items-center justify-start xl:justify-center pt-8 xl:pt-0 p-4 pb-12 box-border font-sans overflow-x-hidden">
      <AnimatePresence>
        {gameState === "setup" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden bg-gradient-to-br from-green-200 to-blue-200 py-10"
          >
            {/* Rules Button */}
            <button
              onClick={() => setRulesOpen(true)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/60 hover:bg-white text-green-700 p-3 rounded-full shadow-lg border-2 border-white/50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center z-50 gap-2 font-black text-xs uppercase tracking-wider"
            >
              <HelpCircle size={20} className="drop-shadow-sm" />
              <span className="hidden sm:inline">How to Play</span>
            </button>

            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10 text-center mb-10 flex flex-col items-center w-full"
            >
              {/* Title Text */}
              <div className="relative z-10 flex items-center justify-center text-5xl md:text-7xl font-black uppercase tracking-tighter text-green-700 drop-shadow-md pb-2 px-8">
                <motion.span 
                  className="text-red-500 mr-3 inline-block drop-shadow-md origin-bottom"
                  animate={{ 
                    rotate: [0, -10, 10, -10, 5, 0],
                    scale: [1, 1.1, 1] 
                  }}
                  transition={{ repeat: Infinity, repeatDelay: 5, duration: 1.2, ease: "easeInOut" }}
                >🐍</motion.span>
                <div className="relative group">
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-clip-text text-transparent bg-gradient-to-br from-green-600 to-green-800 tracking-tighter drop-shadow-sm pb-1 relative z-10"
                  >
                    Snakes & Ladders
                  </motion.div>
                </div>
                <motion.span 
                  className="text-yellow-600 ml-3 inline-block drop-shadow-md"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, repeatDelay: 4, duration: 1, ease: "easeInOut" }}
                >🪜</motion.span>
              </div>
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-2xl md:text-3xl font-black uppercase tracking-widest text-blue-700 mt-2"
              >
                Tree of Knowledge
              </motion.h2>
            </motion.div>

            <div className="glass-panel p-6 md:p-10 rounded-[2rem] w-full max-w-md relative z-10 flex flex-col items-center bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] mt-4">
                <div className="w-full flex flex-col gap-4 relative pt-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700 text-center mb-1 drop-shadow-sm">Online Multiplayer</p>
                  
                  {gameId ? (
                    <div className="text-center bg-indigo-50 p-4 rounded-2xl border border-indigo-200 shadow-inner relative">
                      {gameId && (
                        <button
                          onClick={handleCopyCode}
                          className="absolute top-3 right-3 text-indigo-400 hover:text-indigo-600 transition-colors"
                          title="Copy Room Code"
                        >
                          {copiedCode ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                        </button>
                      )}
                      <div className="font-black text-indigo-900 text-xl mb-1 drop-shadow-sm tracking-widest leading-tight">{gameId}</div>
                      <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mb-3">Room Code</div>
                      
                      <div className="mb-3">
                        <input
                          type="text"
                          value={lobbyData[localPlayerId]?.name || ""}
                          onChange={(e) => updateLobbyItem({ name: e.target.value })}
                          placeholder="Team Name"
                          className="w-full text-center text-sm font-bold px-3 py-1.5 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      
                      <p className="text-[10px] sm:text-xs text-indigo-600 mb-2 font-bold uppercase shrink-0">Choose Team Color</p>
                      <div className="flex justify-center gap-1.5 mb-3 overflow-hidden px-1 py-1">
                        {colors.map((c, i) => {
                          const isSelected = lobbyData[localPlayerId]?.colorIndex === i;
                          const isTaken = Object.entries(lobbyData).some(([uid, data]: [string, any]) => uid !== localPlayerId && data.colorIndex === i);
                          return (
                          <button
                            key={i}
                            disabled={isTaken}
                            onClick={() => updateLobbyItem({ colorIndex: i })}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 border-[2px] transition-all ${isSelected ? "scale-110 shadow-md border-indigo-500" : "border-transparent"} ${isTaken ? "opacity-30 cursor-not-allowed" : "hover:scale-110"}`}
                            style={{ backgroundColor: c.hex }}
                          />
                        )})}
                      </div>

                      <div className="text-[10px] sm:text-xs text-left mb-3 bg-white/60 p-2 sm:p-3 rounded-xl border border-indigo-100 max-h-24 overflow-y-auto">
                         <div className="font-bold text-indigo-800 mb-1 border-b border-indigo-100 pb-1">Joined Teams:</div>
                         {Object.values(lobbyData).map((p: any, idx) => (
                           <div key={idx} className="flex items-center gap-2 mb-1">
                             <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: p.colorIndex !== null ? colors[p.colorIndex].hex : '#cbd5e1'}}></div>
                             <span className="font-bold text-gray-700">{p.name || `Player ${idx + 1}`}</span>
                           </div>
                         ))}
                      </div>

                      {isHost ? (
                        <button
                          onClick={startMultiplayerGame}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl transition-all shadow-sm uppercase tracking-wider text-xs sm:text-sm"
                        >
                          Start Game
                        </button>
                      ) : (
                        <p className="text-xs font-bold text-indigo-600 animate-pulse">Waiting for host...</p>
                      )}
                    </div>
                  ) : (
                    <>
                      {user?.email === "teachertechsolution@gmail.com" && (
                        <button onClick={createGame} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black py-4 rounded-xl transition-all text-sm uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                          Create Private Room
                        </button>
                      )}
                     <div className="flex gap-3 mt-2">
                        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="ENTER CODE" className="flex-1 w-full border-2 border-indigo-100 rounded-xl px-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 uppercase font-black text-indigo-900 text-center tracking-widest" />
                        <button id="join-btn" onClick={joinSession} className="bg-white hover:bg-indigo-50 border-2 border-indigo-200 text-indigo-800 font-black py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow-md text-sm uppercase tracking-wider">Join</button>
                     </div>
                      
                      {user?.email !== "teachertechsolution@gmail.com" && (
                        <div className="mt-4 flex flex-col items-center">
                          {roomRequest?.status === "pending" ? (
                            <p className="text-xs font-bold text-indigo-500 animate-pulse bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                              Waiting for admin to approve...
                            </p>
                          ) : (
                            <button onClick={requestRoomCode} className="text-xs text-indigo-500 hover:text-indigo-700 font-bold underline underline-offset-2 transition-colors">
                              Need a room code? Request from admin
                            </button>
                          )}
                        </div>
                      )}

                      <div className="relative flex items-center py-5">
                        <div className="flex-grow border-t border-indigo-200"></div>
                        <span className="flex-shrink-0 mx-4 text-indigo-400 text-xs font-bold uppercase tracking-widest">Or</span>
                        <div className="flex-grow border-t border-indigo-200"></div>
                      </div>

                      <div className="bg-slate-800/5 p-4 rounded-xl border border-indigo-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                             <User size={14} className="text-indigo-500" />
                             Play vs CPU
                          </span>
                          <select 
                            value={localCpuCount}
                            onChange={(e) => setLocalCpuCount(Number(e.target.value))}
                            className="bg-white border border-indigo-200 text-indigo-800 text-xs font-black rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 shadow-sm"
                          >
                            <option value={1}>1 CPU</option>
                            <option value={2}>2 CPUs</option>
                            <option value={3}>3 CPUs</option>
                            <option value={4}>4 CPUs</option>
                            <option value={5}>5 CPUs</option>
                          </select>
                        </div>
                        <button onClick={() => startGame(0, false, localCpuCount)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl transition-all shadow-sm uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                          <User size={16} /> Start Local Game
                        </button>
                        {hasSavedGame && (
                          <button onClick={resumeLocalGame} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition-all shadow-sm uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                            <Clock size={16} /> Resume Saved Game
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

              <button
                onClick={() => {
                  audio.init();
                  setLocation("/admin");
                }}
                className="w-full mt-8 bg-black/5 hover:bg-black/10 text-indigo-900/60 hover:text-indigo-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                <Settings size={14} /> Admin Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gameState === "playing" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex w-full flex-col lg:flex-row pb-12 lg:pb-0 gap-6 lg:gap-8 items-center justify-center mx-auto z-10 relative"
        >
          <AnimatePresence>
            {showTurnPopup && players[currentTurn] && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="absolute top-10 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
              >
                <div
                  className="px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 text-white font-black uppercase text-2xl tracking-widest text-center flex items-center gap-4"
                  style={{
                    backgroundColor: players[currentTurn].color.hex,
                    borderColor: "white",
                  }}
                >
                  <div className="w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-inner text-3xl">
                    {players[currentTurn].id + 1}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm block opacity-80 mb-1">Get Ready</span>
                    {players[currentTurn].name || `Team ${players[currentTurn].id + 1}`}'s Turn!
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Main Board Area */}
          <div className="flex flex-col items-center w-full max-w-[90vw] sm:max-w-[500px] lg:max-w-[80vh] shrink-0">
            <div className="relative w-full mb-10 sm:mb-12 flex gap-2 justify-between items-center bg-white/50 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-md font-black uppercase tracking-widest text-indigo-900 border border-white/50 text-[10px] sm:text-sm">
              <div>
                Timer:{" "}
                {timeLeft !== null
                  ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`
                  : "∞"}
              </div>
              <div>{players.length} Teams</div>
            </div>
            <div className="w-full aspect-square relative shadow-2xl rounded-xl sm:rounded-none overflow-hidden sm:overflow-visible">
              <div id="game-board" className="w-full h-full relative">
                {/* Add Tile backgrounds and numbers rendering */}
              {Array.from({ length: 100 }).map((_, i) => {
                const num = 1 + i;
                const c = getCoords(num);
                const themeColors = boardThemes.find(t => t.id === boardThemeId)?.colors || boardThemes[0].colors;
                const tileColor = themeColors[num % themeColors.length];
                return (
                  <div
                    key={num}
                    className="board-tile"
                    style={{
                      backgroundColor: tileColor,
                      gridColumn: Math.floor(c.x / 100) + 1,
                      gridRow: Math.floor(c.y / 100) + 1,
                    }}
                  >
                    <span>{num}</span>
                  </div>
                );
              })}
              {/* SVG Connections Overlay */}
              <svg
                className="absolute inset-0 pointer-events-none z-[15]"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                style={{ width: "100%", height: "100%" }}
              >
                {/* Realistic Ladders */}
                {ladders.map((l, idx) => {
                  const start = getCoords(l.base);
                  const end = getCoords(l.top);
                  const dx = end.x - start.x;
                  const dy = end.y - start.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const nx = dx / len;
                  const ny = dy / len;
                  const w = 12;
                  const x1_l = start.x - ny * w;
                  const y1_l = start.y + nx * w;
                  const x2_l = end.x - ny * w;
                  const y2_l = end.y + nx * w;
                  const x1_r = start.x + ny * w;
                  const y1_r = start.y - nx * w;
                  const x2_r = end.x + ny * w;
                  const y2_r = end.y - nx * w;
                  const rungCount = Math.floor(len / 30);
                  const rungs = [];
                  for (let i = 1; i <= rungCount; i++) {
                    const t = i / (rungCount + 1);
                    rungs.push(
                      <line
                        key={i}
                        x1={x1_l + (x2_l - x1_l) * t}
                        y1={y1_l + (y2_l - y1_l) * t}
                        x2={x1_r + (x2_r - x1_r) * t}
                        y2={y1_r + (y2_r - y1_r) * t}
                        stroke="#000"
                        strokeWidth="6"
                      />,
                    );
                  }
                  return (
                    <g key={`lad-${idx}`}>
                      <line
                        x1={x1_l}
                        y1={y1_l}
                        x2={x2_l}
                        y2={y2_l}
                        stroke="#000"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      <line
                        x1={x1_r}
                        y1={y1_r}
                        x2={x2_r}
                        y2={y2_r}
                        stroke="#000"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {rungs}
                    </g>
                  );
                })}
                {/* Realistic Snakes */}
                {activeSnakes.map((s, idx) => {
                  const start = getCoords(s.head);
                  const end = getCoords(s.tail);
                  const dx = end.x - start.x;
                  const dy = end.y - start.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const nx = dx / len;
                  const ny = dy / len;
                  // S-curve points
                  const cx1 = start.x + dx * 0.25 - ny * 80;
                  const cy1 = start.y + dy * 0.25 + nx * 80;
                  const cx2 = start.x + dx * 0.75 + ny * 80;
                  const cy2 = start.y + dy * 0.75 - nx * 80;
                  const dPath = `M ${start.x} ${start.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${end.x} ${end.y}`;

                  const headAngle =
                    (Math.atan2(start.y - cy1, start.x - cx1) * 180) / Math.PI;

                  return (
                    <motion.g
                      key={`snk-${idx}`}
                      filter="drop-shadow(0px 8px 6px rgba(0,0,0,0.4))"
                      animate={{
                        y: [0, -8, 0, 8, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3 + (idx % 3),
                        ease: "easeInOut",
                        times: [0, 0.25, 0.5, 0.75, 1]
                      }}
                    >
                      {/* Snake Body Outline & Fill */}
                      <path
                        d={dPath}
                        stroke="#000"
                        strokeWidth="20"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d={dPath}
                        stroke={s.color1}
                        strokeWidth="14"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* Belly/Pattern */}
                      <path
                        d={dPath}
                        stroke="#fff"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="10 15"
                      />

                      {/* Realistic Snake Head */}
                      <g
                        transform={`translate(${start.x}, ${start.y}) rotate(${headAngle})`}
                      >
                        <path
                          d="M -10 -15 Q 20 -25 30 0 Q 20 25 -10 15 Q -25 0 -10 -15 Z"
                          fill={s.color1}
                          stroke="#000"
                          strokeWidth="3"
                        />
                        <path
                          d="M 30 0 Q 45 -4 50 -10 M 40 -4 Q 45 4 40 10"
                          stroke="#ef4444"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="10"
                          cy="-8"
                          r="4"
                          fill="#fff"
                          stroke="#000"
                          strokeWidth="1.5"
                        />
                        <circle cx="12" cy="-8" r="2" fill="#000" />
                        <circle
                          cx="10"
                          cy="8"
                          r="4"
                          fill="#fff"
                          stroke="#000"
                          strokeWidth="1.5"
                        />
                        <circle cx="12" cy="8" r="2" fill="#000" />
                      </g>
                    </motion.g>
                  );
                })}
              </svg>

              {/* Elements Overlay */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
                {activeTrees.map((t) => {
                  const c = getCoords(t);
                  return (
                    <div
                      key={t}
                      className="absolute z-20 pointer-events-none drop-shadow-md text-3xl sm:text-4xl"
                      style={{
                        left: `${c.x / 10}%`,
                        top: `${c.y / 10}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      🌳
                    </div>
                  );
                })}
              </div>

              {/* Players */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
                {players.map((p) => {
                  const c = getCoords(p.pos);
                  const isCurrent =
                    currentTurn === p.id && !isMovingRef.current;
                  const isCounting = stepCount?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`player-token ${p.color.bg} ${isCurrent ? "pulse-ring" : ""}`}
                      style={{
                        left: `calc(${c.x / 10}% + ${(players.filter((x) => x.pos === p.pos).indexOf(p) - (players.filter((x) => x.pos === p.pos).length - 1) / 2) * 8}px)`,
                        top: `calc(${c.y / 10}% + ${(players.filter((x) => x.pos === p.pos).indexOf(p) - (players.filter((x) => x.pos === p.pos).length - 1) / 2) * 8}px)`,
                        transform: "translate(-50%, -50%)",
                        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    >
                      {isCounting ? (
                        <div className={`absolute ${p.pos > 90 ? "-bottom-10" : "-top-10"} left-1/2 -translate-x-1/2 bg-white text-black font-black text-xl px-2 py-0.5 rounded-full shadow-xl border-2 border-black z-[100] animate-[bounce_0.5s_infinite]`}>
                          {stepCount.count}
                        </div>
                      ) : null}
                      {p.id + 1}
                    </div>
                  );
                })}
              </div>

              {/* Grid Tiles */}
              {/* Handled above */}
              </div>
            </div>
          </div>

          {/* Dashboard sidebar */}
          <div className="flex flex-col lg:gap-3 gap-2 w-full lg:w-[200px] shrink-0 justify-center z-40 pb-6 lg:pb-0">
            {/* CURRENT TURN CARD */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 flex flex-col items-center shadow-xl w-full transform transition-all order-1 lg:order-none">
              <h2 className="text-xs lg:text-[10px] font-black text-gray-800 uppercase tracking-widest mb-3 lg:mb-2 text-center opacity-70">
                Current Turn
              </h2>
              <div className="flex items-center gap-3 mb-4 lg:mb-3">
                <div
                  className="w-10 h-10 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white font-black text-lg lg:text-sm shadow-md border-2 border-white"
                  style={{
                    backgroundColor: players[currentTurn]?.color?.hex || "#ccc",
                  }}
                >
                  {players[currentTurn]?.id !== undefined ? players[currentTurn].id + 1 : ""}
                </div>
                <div className="font-black text-gray-800 text-base lg:text-sm max-w-[120px] truncate" title={players[currentTurn]?.name || `Team ${players[currentTurn]?.id + 1}`}>
                  {players[currentTurn]?.name || `Team ${players[currentTurn]?.id + 1}`}
                </div>
              </div>

              {/* DICE BUTTON */}
              <button
                onClick={rollDice}
                disabled={isRolling || isMoving || players[currentTurn]?.isCpu || (gameId !== null && players[currentTurn]?.uid !== localPlayerId)}
                className={`w-full py-3.5 lg:py-2.5 rounded-full font-black uppercase tracking-widest text-xs lg:text-[10px] transition-all shadow-lg lg:shadow-md ${
                  isRolling || isMoving || players[currentTurn]?.isCpu || (gameId !== null && players[currentTurn]?.uid !== localPlayerId)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/50 hover:shadow-xl hover:-translate-y-1 hover:scale-105 active:scale-95"
                }`}
              >
                {players[currentTurn]?.isCpu
                  ? "CPU Turn"
                  : isRolling
                    ? "Rolling..."
                    : (gameId !== null && players[currentTurn]?.uid !== localPlayerId)
                      ? "Waiting..."
                      : "Roll Dice"}
              </button>
            </div>

            {user?.email === "teachertechsolution@gmail.com" && gameId !== null && (
              <div className="flex flex-row lg:flex-col gap-2 order-2 w-full mt-2 lg:mt-0">
                {/* TEACHER PANEL */}
                <button
                  onClick={() => {
                    audio.init();
                    setLocation("/admin");
                  }}
                  className="flex-1 bg-[#646cff] hover:bg-blue-600 text-white font-black py-2.5 rounded-full uppercase tracking-widest shadow-md flex items-center justify-center gap-1 text-[10px] transition-all hover:scale-105 active:scale-95"
                >
                  <Settings size={12} /> Admin
                </button>

                {/* END GAME */}
                <button
                  onClick={resetGame}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-2.5 rounded-full uppercase tracking-widest shadow-md text-[10px] transition-all hover:scale-105 active:scale-95"
                >
                  End Game
                </button>
              </div>
            )}

            {!gameId && (
              <div className="flex flex-row lg:flex-col gap-2 order-2 w-full mt-2 lg:mt-0">
                <button
                  onClick={() => {
                    saveLocalGame();
                    resetGame();
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 rounded-full uppercase tracking-widest shadow-md flex items-center justify-center gap-1 text-[10px] transition-all hover:scale-105 active:scale-95"
                >
                  Save & Quit
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem("savedLocalGame");
                    setHasSavedGame(false);
                    resetGame();
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-2.5 rounded-full uppercase tracking-widest shadow-md flex items-center justify-center gap-1 text-[10px] transition-all hover:scale-105 active:scale-95"
                >
                  Quit Game
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {/* Event Message Modal */}
        {msgModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250]"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl max-w-sm w-full p-8 text-center border-b-8 border-indigo-500 shadow-2xl"
            >
              <div className="text-6xl mb-4 animate-bounce">ℹ️</div>
              <h2 className="text-3xl font-black text-gray-800 mb-3">
                {msgModal.title}
              </h2>
              <p className="text-lg text-gray-600 font-bold">{msgModal.text}</p>
            </motion.div>
          </motion.div>
        )}

        {/* Anomaly Question Modal */}
        {qModal.open && qModal.qData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl max-w-lg w-full p-8 text-center border-b-8 border-green-500 shadow-2xl"
            >
              <div className="text-6xl mb-4">🌳</div>
              <h2 className="text-2xl font-black text-green-700 mb-2 uppercase tracking-wide flex flex-col items-center gap-1">
                Tree of Knowledge
                {questionTimeLeft !== null && (
                  <span className={`text-3xl mt-2 p-2 rounded-xl transition-all font-mono ${questionTimeLeft <= 5 ? "text-red-600 bg-red-100 animate-pulse border-2 border-red-500 scale-110" : "text-slate-600 bg-slate-100"}`}>
                    {questionTimeLeft}s
                  </span>
                )}
              </h2>
              {qModal.resolve === null && qModal.cpName && (
                 <p className="text-indigo-600 font-bold mb-4 animate-pulse uppercase tracking-wider bg-indigo-50 inline-block px-4 py-1 rounded-full text-xs">
                   Waiting for {qModal.cpName} to answer...
                 </p>
              )}
              <p className="text-sm text-gray-500 mb-6 font-bold uppercase tracking-wider bg-gray-100 inline-block px-4 py-1 rounded-full">
                Correct: +3 steps | Wrong: -1 step
              </p>

              <div className="text-lg font-black text-gray-800 mb-8 bg-green-50 p-6 rounded-2xl border border-green-200 shadow-inner">
                {qModal.qData.q}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {qModal.qData.opts.map((opt, i) => (
                  <button
                    key={i}
                    disabled={qFeedback !== null}
                    onClick={() => handleAnswerClick(i)}
                    className={`w-full font-bold py-4 px-6 rounded-2xl border-2 text-base transition-all flex justify-between items-center group
                                        ${qFeedback === null ? "bg-white border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-800" : ""}
                                        ${qFeedback !== null && i === qModal.qData?.ans ? "bg-green-500 border-green-600 text-white shadow-xl" : ""}
                                        ${qFeedback !== null && qFeedback === "wrong" && i !== qModal.qData?.ans ? "bg-red-50 border-red-200 text-red-500" : ""}`}
                  >
                    <span>{opt}</span>
                    {qFeedback === null && (
                      <ChevronRight
                        size={20}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                    {qFeedback !== null && i === qModal.qData?.ans && (
                      <CheckCircle2 size={24} />
                    )}
                    {qFeedback === "wrong" && i !== qModal.qData?.ans && (
                      <XCircle size={24} className="text-red-500" />
                    )}
                  </button>
                ))}
              </div>
              <div className="text-lg font-black uppercase tracking-widest mt-6 h-8">
                {qFeedback === "correct" && (
                  <span className="text-green-600">Correct! Move Forward!</span>
                )}
                {qFeedback === "wrong" && (
                  <span className="text-red-600">Wrong! Move Back.</span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Victory Modal */}
        {winModal.open && winModal.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-10 shadow-2xl border-b-8"
              style={{ borderColor: winModal.winner.color.hex }}
            >
              <div className="text-8xl mb-6 animate-bounce">
                {winModal.timeUp ? "⏱️" : "🏆"}
              </div>
              <h2
                className="font-black mb-4 text-4xl uppercase"
                style={{ color: winModal.winner.color.hex }}
              >
                {winModal.timeUp
                  ? "Time's Up!"
                  : `${winModal.winner.name} Wins!`}
              </h2>
              <p className="text-base text-gray-500 mb-8 font-bold uppercase tracking-widest">
                {winModal.timeUp
                  ? `${winModal.winner.name} is furthest!`
                  : "Congratulations!"}
              </p>
              <button
                onClick={resetGame}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-xl shadow-lg w-full transition-all uppercase tracking-widest text-sm transform hover:-translate-y-1"
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Support Developer Modal */}
        {supportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-md flex flex-col p-8 shadow-2xl relative overflow-hidden items-center text-center border-b-8 border-pink-500"
            >
              <button
                onClick={() => setSupportOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={28} />
              </button>

              <div className="text-5xl mb-4 animate-bounce">💖</div>
              <h2 className="text-2xl font-black text-pink-700 mb-2 uppercase tracking-wide">
                Support the Developer
              </h2>

              <p className="text-gray-600 mb-6 font-bold leading-relaxed">
                Creating and maintaining this interactive learning tool takes
                time, effort, and resources. Your support helps keep this game
                free for educators and students, funds new features, and covers
                server maintenance costs.
              </p>

              <div className="bg-pink-50 p-6 rounded-2xl border border-pink-200 w-full flex flex-col items-center">
                <p className="text-sm font-black text-pink-700 uppercase tracking-widest mb-4">
                  Scan or Tap QR to Donate
                </p>
                <img
                  src="https://www.dropbox.com/scl/fi/7j6orklirit4cwh8cocvi/kaKrHo6S1Qqeydf1gWRKZ72U.png?rlkey=y1szb8yiddoijot7m8xm22eea&st=qw6i5aul&raw=1"
                  alt="Donation QR Code"
                  className="w-48 h-48 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all border-4 border-white hover:scale-105"
                  onClick={() => setZoomedQR(true)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Zoomed QR Modal */}
        {zoomedQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[400] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomedQR(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <img
                src="https://www.dropbox.com/scl/fi/7j6orklirit4cwh8cocvi/kaKrHo6S1Qqeydf1gWRKZ72U.png?rlkey=y1szb8yiddoijot7m8xm22eea&st=qw6i5aul&raw=1"
                alt="Donation QR Code Zoomed"
                className="w-full max-w-lg rounded-3xl shadow-2xl border-8 border-white/20"
              />
              <div className="absolute top-4 right-4 text-white hover:text-red-400 bg-black/60 hover:bg-black/80 rounded-full p-2 transition-colors cursor-pointer">
                <X size={32} />
              </div>
              <p className="text-center text-white/50 font-bold mt-4 uppercase tracking-widest">
                Tap anywhere to close
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Game Rules Modal */}
        {rulesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[400] p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white/95 rounded-[2.5rem] w-full max-w-md flex flex-col p-8 sm:p-10 shadow-2xl relative overflow-hidden items-center border-[6px] border-emerald-400"
            >
              <button
                onClick={() => setRulesOpen(false)}
                className="absolute top-6 right-6 text-emerald-900/40 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
              >
                <X size={24} className="stroke-[3]" />
              </button>

              <div className="absolute -top-10 -right-10 text-9xl opacity-10">🐍</div>
              <div className="absolute -bottom-10 -left-10 text-9xl opacity-10">🪜</div>

              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative z-10">
                 <BookOpen className="w-10 h-10 text-emerald-500" />
                 <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-400 rounded-full border-4 border-white"></div>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-800 mb-8 uppercase tracking-widest text-center relative z-10 flex flex-col items-center">
                <span className="text-xs text-emerald-600 mb-1 tracking-[0.3em]">Welcome to</span>
                How to Play!
              </h2>

              <div className="w-full flex gap-4 text-left relative z-10 flex-col mb-8 font-sans">
                <div className="flex items-start gap-4">
                   <div className="text-3xl mt-0.5 filter drop-shadow-sm">🏁</div>
                   <div>
                     <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-0.5 text-emerald-600">The Goal</h4>
                     <p className="text-slate-600 text-sm font-bold leading-snug">Race your friends and reach the final tile (100) before anyone else!</p>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="text-3xl mt-0.5 filter drop-shadow-sm">🪜</div>
                   <div>
                     <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-0.5 text-blue-600">Ladders</h4>
                     <p className="text-slate-600 text-sm font-bold leading-snug">Land at the bottom of a ladder to instantly climb way up high!</p>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="text-3xl mt-0.5 filter drop-shadow-sm">🐍</div>
                   <div>
                     <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-0.5 text-red-600">Snakes</h4>
                     <p className="text-slate-600 text-sm font-bold leading-snug">Uh oh! Landing on a snake's head means sliding all the way down.</p>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="text-3xl mt-0.5 filter drop-shadow-sm">🌳</div>
                   <div>
                     <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-0.5 text-amber-600">Trees of Knowledge</h4>
                     <p className="text-slate-600 text-sm font-bold leading-snug">Answer a trivia question correctly to stay safe... or move back down!</p>
                   </div>
                </div>
              </div>

              <button
                onClick={() => setRulesOpen(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-[0_10px_20px_rgba(16,185,129,0.4)] uppercase tracking-[0.2em] hover:-translate-y-1 active:translate-y-0 text-sm w-full relative z-10"
              >
                Let's Go!
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Big Dice Overlay */}
        {showBigDice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className={`bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border-4 border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative ${isRolling ? "dice-shake" : ""}`}
              style={{ width: "200px", height: "200px" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 dark:from-slate-800 dark:to-slate-900"></div>
              <div className="relative grid grid-cols-3 grid-rows-3 gap-3 w-full h-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className="bg-black dark:bg-white rounded-full shadow-inner transform transition-all duration-100"
                    style={{
                      opacity: diceConfig[diceVal]?.includes(i) ? 1 : 0,
                      transform: diceConfig[diceVal]?.includes(i)
                        ? "scale(1)"
                        : "scale(0.5)",
                    }}
                  ></div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
