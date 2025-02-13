/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
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
    let attestationId: number, leafDigest: string, blockHash: any;

    const { events, transactionResult } = await session
      .verify()
      .groth16(Library.snarkjs, CurveType.bn128)
      .waitForPublishedAttestation()
      .withRegisteredVk()
      .execute({
        proofData: {
          vk: process.env.VKEY_HASH!,
          proof,
          publicSignals,
        },
      });

    events.on(ZkVerifyEvents.IncludedInBlock, (data: any) => {
      console.log("Transaction included in block:", data);
      leafDigest = data.leafDigest;
      blockHash = data.blockHash;
      attestationId = data.attestationId;
    });

    events.on(ZkVerifyEvents.Finalized, (eventData) => {
      console.log("Transaction finalized:", eventData);
    });

    const proofPromise = new Promise((resolve, reject) => {
      events.once(ZkVerifyEvents.AttestationConfirmed, async (eventData) => {
        try {
          const proofDetails = await session.poe(attestationId, leafDigest);
          resolve(proofDetails);
        } catch (error) {
          reject(error);
        }
      });
    });

    const transactionInfo = await transactionResult;

    if (transactionInfo?.attestationId) {
      let details: any, attestationId, merklePath, leaf, leafCount, index;

      try {
        details = await proofPromise;
        attestationId = transactionInfo.attestationId;
        merklePath = details.proof;
        leaf = details.leaf;
        leafCount = details.numberOfLeaves;
        index = details.leafIndex;
      } catch (error) {
        return NextResponse.json({
          status: "error",
          error: "Failed to fetch proof details from event.",
        });
      }
      return NextResponse.json({
        status: "verified",
        attestationId,
        merklePath,
        leaf,
        leafCount,
        index,
      });
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
