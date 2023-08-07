import {
    Box,
    Button,
    Center,
    Flex,
    Image,
    Input,
    SimpleGrid,
    Card,
    Stack,
    CircularProgress,
} from '@chakra-ui/react';
import {Alchemy, Network, Utils} from 'alchemy-sdk';
import {useState} from 'react';
import {ethers} from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
    const [userAddress, setUserAddress] = useState('');
    const [results, setResults] = useState([]);
    const [tokenDataObjects, setTokenDataObjects] = useState([]);
    const [status, setStatus] = useState('');


    // Connect to browser wallet (e.g. MetaMask) and get the active wallet address
    async function getWalletAddress() {
        const accounts = await provider.send('eth_requestAccounts', []);
        setUserAddress(accounts[0]);
    }


    // Query the Alchemy Token API to get a list of tokens and balances for the user address
    async function getTokenBalance() {
        if (userAddress === '') {   // text input is blank
            setStatus('');
            return
        } else if (!ethers.utils.isAddress(userAddress)) {  // check textbox input is a valid hex address
            setStatus('invalid')
            return
        }

        setStatus('fetching');  // if input is valid then start querying

        // get the private Alchemy API key and set the network from .env file
        const config = {
            apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
            network: Network.ETH_MAINNET,
        };

        // connect to the API and get a list of token names and balances
        const alchemy = new Alchemy(config);
        const data = await alchemy.core.getTokenBalances(userAddress);

        // filter the results to only tokens with balance > 0
        const filtered = data.tokenBalances.filter((item) => {
            return item.tokenBalance > 0
        })
        setResults(filtered);

        // query the API for each token metadata, return promises, then await the promises all at once
        const tokenDataPromises = [];
        if (filtered.length > 0) {
            for (let i = 0; i < filtered.length; i++) {
                const tokenData = alchemy.core.getTokenMetadata(
                    filtered[i].contractAddress
                );
                tokenDataPromises.push(tokenData);
            }
            setTokenDataObjects(await Promise.all(tokenDataPromises));  // get the actual metadata
            setStatus('loaded'); // data has been updated
            return;
        }

        setStatus('notfound')  // no token balances > 0 returned

    }

    return (
        <Box w="100vw" h="100vh">
            <Center className="head">ERC-20 Token Balance Checker</Center>
            <Box pt={36}>
            <Flex
                w="100%"
                flexDirection="column"
                alignItems="center"
                justifyContent={'center'}
            >

                <Input
                    onChange={(e) => {
                        setStatus('');
                        setUserAddress(e.target.value);
                    }}
                    color="black"
                    w="600px"
                    textAlign="center"
                    p={4}
                    bgColor="white"
                    fontSize={24}
                    value={userAddress}
                    placeholder="Enter an address or get address from browser wallet"
                />

                {(userAddress === '') ? (   // if text input is blank, show button to get browser wallet addr
                    <Button fontSize={20} onClick={getWalletAddress} mt={36}>
                        Get browser wallet address
                    </Button>
                ) : (  // else let user initiate the API query to get balances
                    <Button fontSize={20} onClick={getTokenBalance} mt={36}>
                        Check ERC-20 Token Balances
                    </Button>
                )
                }

                {(status === 'loaded') ? (  // token data has been loaded, so display in a grid
                    <div>
                        <SimpleGrid w={'90vw'} mt={36} columns={4} spacing={30}>
                            {results.map((e, i) => {
                                return (
                                    <Card key={i} className='test'>
                                        <Stack>
                                            <Image src={tokenDataObjects[i].logo} maxH={64}
                                                   maxW={64} boxSize={64}/>
                                            <div>{Utils.formatUnits(
                                                e.tokenBalance,
                                                tokenDataObjects[i].decimals
                                            )}</div><div>{tokenDataObjects[i].symbol}</div>

                                        </Stack>
                                    </Card>


                                );
                            })}
                        </SimpleGrid>
                    </div>

                ) : null }

                {/* show loading indicator or error message, based on status */}
                {(status === 'fetching') ? <CircularProgress isIndeterminate mt={36}/> : null}
                {(status === 'invalid') ? <Box color="red" mt={36}>Invalid address</Box> : null }
                {(status === 'notfound') ? <Box color="red" mt={36}>No ERC-20 tokens found</Box> : null }
            </Flex>
            </Box>
        </Box>
    );
}

export default App;
