
import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home(){
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false)
  const [isOnwer, setIsOnwer] = useState(false)
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");

  const web3ModalRef = useRef();

  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);

      const tx = await nftContract.presaleMint({
        value: utils.parseEther("0.01")
      })
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (error) {
      console.error(error)
    }
  }

  const publicMint = async () => {
    try {
      
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the mint from the contract to mint the Crypto Dev
      const tx = await nftContract.mint({
        // value signifies the cost of one crypto dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error)
    }
  }

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);

      const tx = await nftContract.startPresale();

      setLoading(true);
      await tx.wait();
      setLoading(false);
      await checkIfPresaleStarted();
    } catch (error) {
      console.error(error)
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi);
      
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted){
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (error) {
      console.error(error);
      return false
    }
  }

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi);

      const _presaleEnded = await nftContract.presaleEnded();
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now()/1000));

      if (hasEnded){
        setPresaleEnded(true)
      }
      else {
        setPresaleEnded(false);
      }
      return hasEnded
    } catch (error) {
      console.error(error)
      return false;
    }
  }

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi);

      const _owner = await nftContract.owner();

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()){
        setIsOnwer(true)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi)

      const _tokenIds = await nftContract.tokenIds()

      setTokenIdsMinted(_tokenIds.toString())
    } catch (error) {
      console.error(error)
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    if (needSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  useEffect(() => { 
    if (!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network:"sepolia",
        providerOptions:{},
        disableInjectedProvider: false
      })
      connectWallet()

      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted){
        checkIfPresaleEnded()
      }

      getTokenIdsMinted()
      // Set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);

    }
  },[walletConnected])
}