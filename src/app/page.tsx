"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Webcam from "react-webcam";
import Swal from "sweetalert2";

type CheckType = "IN" | "OUT";
type Status = "idle" | "locating" | "ready" | "capturing" | "sending" | "success" | "error" | "no_user";

function CheckInComponent() {
  const webcamRef = useRef<Webcam>(null);
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("idle");
  const [username, setUsername] = useState<string | null>(null);
  const [checkType, setCheckType] = useState<CheckType | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    const user = searchParams.get("username");
    if (user) {
      setUsername(user);
      setStatus("idle");
    } else {
      setStatus("no_user");
      Swal.fire({
        icon: 'error',
        title: 'ไม่พบข้อมูลผู้ใช้!',
        text: 'กรุณาเข้าใช้งานผ่านลิงก์ที่ถูกต้อง (เช่น ?username=ชื่อผู้ใช้)',
        allowOutsideClick: false,
      });
    }
  }, [searchParams]);

  const handleCheckTypeSelect = (type: CheckType) => {
    if (status === 'no_user') return;
    setStatus("locating");
    setCheckType(type);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setStatus("ready");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatus("error");
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถเข้าถึงพิกัดได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง',
        });
        resetState(false); // Reset without delay
      }
    );
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImgSrc(imageSrc);
        setStatus("capturing");
      } else {
        setStatus("error");
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถถ่ายภาพได้ กรุณาลองอีกครั้ง',
        });
      }
    }
  }, [webcamRef]);

  const handleSubmit = async () => {
    if (!imgSrc || !location || !checkType || !username) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'จำเป็นต้องมีรูปภาพ, พิกัด, ประเภท, และชื่อผู้ใช้',
      });
      return;
    }

    setStatus("sending");
    Swal.fire({
      title: 'กำลังส่งข้อมูล...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("checkType", checkType);
      formData.append("latitude", location.lat.toString());
      formData.append("longitude", location.lon.toString());
      
      const blob = await (await fetch(imgSrc)).blob();
      formData.append("photo", blob, "capture.jpg");

      const response = await fetch("/api/check-in", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("success");
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: result.message || 'บันทึกข้อมูลเรียบร้อย',
          timer: 2500,
          showConfirmButton: false,
        });
        resetState();
      } else {
        throw new Error(result.error || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถส่งข้อมูลได้";
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errorMessage,
      });
      resetState(false); // Reset without delay
    }
  };

  const resetState = (withTimeout = true) => {
    const reset = () => {
      setStatus("idle");
      setCheckType(null);
      setLocation(null);
      setImgSrc(null);
    };
    if (withTimeout) {
      setTimeout(reset, 2500);
    } else {
      reset();
    }
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Check-in / Check-out</h1>
        {username && <p className="text-lg text-gray-600 mb-4">สำหรับ: <span className="font-semibold text-blue-700">{username}</span></p>}
        
        {status === "idle" && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={() => handleCheckTypeSelect("IN")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50"
              disabled={status !== 'idle'}
            >
              Check In
            </button>
            <button
              onClick={() => handleCheckTypeSelect("OUT")}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50"
              disabled={status !== 'idle'}
            >
              Check Out
            </button>
          </div>
        )}

        {status === "ready" && !imgSrc && (
            <div className="flex flex-col items-center">
                <p className="text-gray-500 mb-2">กรุณาถ่ายภาพเพื่อยืนยัน</p>
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-4 border-2 border-gray-200">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full h-full"
                    />
                </div>
                <button onClick={capture} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md">
                    ถ่ายภาพ
                </button>
            </div>
        )}

        {imgSrc && (
            <div className="flex flex-col items-center">
                <p className="text-gray-500 mb-2">ภาพถ่ายของคุณ</p>
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-4 border-2 border-blue-500">
                    <img src={imgSrc} alt="Screenshot" className="w-full h-full object-cover" />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={() => setImgSrc(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300">
                        ถ่ายใหม่
                    </button>
                    <button onClick={handleSubmit} className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300">
                        ยืนยัน
                    </button>
                </div>
            </div>
        )}

        {status === "locating" && (
            <div className="flex flex-col items-center justify-center p-8">
                <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gray-600">กำลังค้นหาพิกัด...</p>
            </div>
        )}

        {status === "no_user" && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            <p>ไม่สามารถดำเนินการต่อได้ กรุณาตรวจสอบ URL</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckInComponent />
    </Suspense>
  );
}
