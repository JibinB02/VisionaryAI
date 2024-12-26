/* eslint-disable no-unused-vars */
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Verify = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const success = searchParams.get("success");
  const userId = searchParams.get("order_id");

  const verifyPayment = async () => {
    try {
      console.log(success);
      console.log(userId);
      const { data } = await axios.post(backendUrl + "/api/user/verify", {
        success,
        userId,
      });
      console.log(data);

      if (data.success) {
        toast.success("Credits Added");

        setTimeout(() => {
          navigate("/");
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }, 3000);
      } else {
        toast.error(data.message || "Payment Verification Failed");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Something went wrong!");
    }
  };

  useEffect(() => {
    verifyPayment();
  }, []);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
      <div className="border-t-4 border-blue-500 border-solid rounded-full w-16 h-16 animate-spin"></div>
      <p className="mt-4 text-lg text-gray-700">Verifying...</p>
    </div>
  );
};

export default Verify;
