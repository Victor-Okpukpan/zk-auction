/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import {
  CurveType,
  Library,
  ZkVerifyEvents,
  zkVerifySession,
} from "zkverifyjs";

export async function POST(req: NextRequest) {
  try {
    const { proof, publicSignals, vk } = await req.json();

    if (!proof || !publicSignals || !vk) {
      return NextResponse.json(
        { error: "Proof, public signals, or verification key is missing" },
        { status: 400 }
      );
    }

    const session = await zkVerifySession
      .start()
      .Testnet()
      .withAccount(process.env.SEED_PHRASE!);
    

    console.log("Verifying proof...");

    const { events, transactionResult } = await session
      .verify()
      .groth16(Library.snarkjs, CurveType.bn128)
      .execute({ proofData: { proof, publicSignals, vk: vk } });

    events.on(ZkVerifyEvents.IncludedInBlock, (data: any) => {
      console.log("Transaction included in block:", data);
    });

    events.on(ZkVerifyEvents.Finalized, (eventData) => {
        console.log('Transaction finalized:', eventData);
    });

    const transactionInfo = await transactionResult;

    if (transactionInfo?.attestationId) {
      console.log("Proof verified successfully.");
      return NextResponse.json({ status: "verified", transactionInfo });
    } else {
      return NextResponse.json(
        { status: "error", error: "Your proof isn't correct." },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error verifying proof:", (error as Error).message);
    return NextResponse.json(
      { status: "error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
