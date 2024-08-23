import React, { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { formatEther, parseEther } from '@ethersproject/units';
import { hexValue } from '@ethersproject/bytes';

const NETWORKS = {
    mainnet: 1,
    holesky: 17000,
    sepolia: 11155111
};

const MetaMaskConnect: React.FC = () => {
    const [provider, setProvider] = useState<Web3Provider | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [network, setNetwork] = useState<string | null>(null);
    const [balance, setBalance] = useState<string | null>(null);

    useEffect(() => {
        const setupProvider = async () => {
            if ((window as any).ethereum) {
                const newProvider = new Web3Provider((window as any).ethereum);
                setProvider(newProvider);

                // Obtener la red y el balance actual
                const network = await newProvider.getNetwork();
                const signer = newProvider.getSigner();
                const accountAddress = await signer.getAddress();
                const balance = await signer.getBalance();

                setAccount(accountAddress);
                setNetwork(network.name);
                setBalance(formatEther(balance));

                // Listener para eventos de red
                newProvider.on("network", (newNetwork) => {
                    if (newNetwork.chainId !== NETWORKS.holesky && newNetwork.chainId !== NETWORKS.sepolia) {
                        // Evita actualizaciones innecesarias si la red no es relevante
                        return;
                    }
                    updateNetwork(newNetwork.chainId);
                });

                // Listener para eventos de cambio de red en MetaMask
                (window as any).ethereum.on('chainChanged', (chainId: string) => {
                    updateNetwork(parseInt(chainId, 16));
                });

                // Limpiar los listeners cuando el componente se desmonte
                return () => {
                    newProvider.removeAllListeners("network");
                    (window as any).ethereum.removeListener('chainChanged', updateNetwork);
                };
            }
        };

        setupProvider();
    }, []);

    const connectMetaMask = async () => {
        if ((window as any).ethereum) {
            try {
                const newProvider = new Web3Provider((window as any).ethereum);
                await newProvider.send("eth_requestAccounts", []);
                const signer = newProvider.getSigner();
                const accountAddress = await signer.getAddress();
                const network = await newProvider.getNetwork();
                const balance = await signer.getBalance();

                setProvider(newProvider);
                setAccount(accountAddress);
                setNetwork(network.name);
                setBalance(formatEther(balance));
            } catch (error) {
                console.error("Error connecting to MetaMask:", error);
            }
        } else {
            alert("MetaMask is not installed. Please install it to use this feature.");
        }
    };

    const disconnectMetaMask = () => {
        setProvider(null);
        setAccount(null);
        setNetwork(null);
        setBalance(null);
    };

    const switchNetwork = async (networkId: number) => {
        if (provider) {
            try {
                await provider.send("wallet_switchEthereumChain", [{ chainId: hexValue(networkId) }]);
                // Reiniciar el proveedor para actualizar la información después del cambio de red
                const newProvider = new Web3Provider((window as any).ethereum);
                setProvider(newProvider);
                const network = await newProvider.getNetwork();
                const signer = newProvider.getSigner();
                const balance = await signer.getBalance();

                setNetwork(network.name);
                setBalance(formatEther(balance));
            } catch (error) {
                console.error("Error switching network:", error);
            }
        }
    };

    const updateNetwork = async (chainId: number) => {
        if (provider) {
            try {
                const network = await provider.getNetwork();
                if (network.chainId === chainId) {
                    const balance = await provider.getSigner().getBalance();
                    setNetwork(network.name);
                    setBalance(formatEther(balance));
                } else {
                    // Actualiza la red si cambia, pero evita errores inesperados
                    console.warn(`Network changed unexpectedly. Expected ${chainId}, but got ${network.chainId}`);
                }
            } catch (error) {
                console.error("Error updating network:", error);
            }
        }
    };

    const sendTransaction = async () => {
        if (provider && account) {
            try {
                const signer = provider.getSigner();
                const tx = await signer.sendTransaction({
                    to: account,
                    value: parseEther("0.01")
                });
                await tx.wait();
                alert(`Transaction successful: ${tx.hash}`);
            } catch (error) {
                console.error("Transaction failed:", error);
            }
        }
    };

    return (
        <div>
            <button onClick={connectMetaMask}>
                {account ? `Connected: ${account}` : "Connect to MetaMask"}
            </button>
            {account && (
                <>
                    <div>
                        <p>Network: {network}</p>
                        <p>Balance: {balance} ETH</p>
                    </div>
                    <div className="button-container">
                        <button onClick={() => switchNetwork(NETWORKS.holesky)}>Switch to Holesky</button>
                        <button onClick={() => switchNetwork(NETWORKS.sepolia)}>Switch to Sepolia</button>
                        <button onClick={sendTransaction}>Send 0.01 ETH</button>
                        <button onClick={disconnectMetaMask}>Disconnect</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default MetaMaskConnect;
