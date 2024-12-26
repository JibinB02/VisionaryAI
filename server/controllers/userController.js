import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import transactionModel from "../models/transactionModel.js";

const FRONTEND_URL = process.env.FRONTEND_URL;

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userData = {
      name,
      email,
      password: hashedPassword,
    };
    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token, user: { name: user.name } });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "No user found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      res.json({ success: true, token, user: { name: user.name } });
    } else {
      return res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const userCredits = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    res.json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const plans = {
  10: { id: "basic_plan", credits: 100, amount: 1000 },
  50: { id: "advanced_plan", credits: 500, amount: 5000 },
  250: { id: "business_plan", credits: 5000, amount: 25000 },
};

const paymentStripe = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId || !plans[planId]) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid details" });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const selectedPlan = plans[planId];

    let transaction = await transactionModel.findOne({ userId });

    if (transaction) {
      transaction.credits = selectedPlan.credits;
      transaction.amount = selectedPlan.amount;
      transaction.plan = selectedPlan.id;
      transaction.payment = false;
      transaction.date = Date.now();
      await transaction.save();
    } else {
      const transactionData = {
        userId,
        plan: selectedPlan.id,
        amount: selectedPlan.amount,
        credits: selectedPlan.credits,
        payment: false,
        date: Date.now(),
      };
      transaction = await transactionModel.create(transactionData);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${selectedPlan.credits} Credits Plan`,
              description: `Get ${selectedPlan.credits} credits for $${
                selectedPlan.amount / 100
              }`,
            },
            unit_amount: selectedPlan.amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/verify?success=true&order_id=${transaction.userId}`,
      cancel_url: `${FRONTEND_URL}/verify?success=false&order_id=${transaction.userId}`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const verify = async (req, res) => {
  const { success, userId } = req.body;

  try {
    if (success === "true" || success === true) {
      const transaction = await transactionModel.findOne({ userId });
      const user = await userModel.findById(userId);
      if (!user) {
        return res.json({
          success: false,
          message: "User not found",
        });
      }

      if (!transaction) {
        return res.json({ success: false, message: "Transaction not found" });
      }

      const updatedTransaction = await transactionModel.findByIdAndUpdate(
        transaction._id,
        { payment: true },
        { new: true }
      );

      if (!updatedTransaction) {
        return res.json({
          success: false,
          message: "Error updating transaction",
        });
      }

      const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        { creditBalance: user.creditBalance + updatedTransaction.credits },
        { new: true }
      );

      if (!updatedUser) {
        return res.json({
          success: false,
          message: "Failed to update user credits",
        });
      }

      res.json({ success: true, message: "Payment successful" });
    } else {
      return res.json({ success: false, message: "Payment failed" });
    }
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Error in verification",
      error: error.message,
    });
  }
};

export { registerUser, loginUser, userCredits, paymentStripe, verify };
