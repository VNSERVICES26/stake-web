// Contract ABIs and Addresses
const vnstTokenABI = [/* Your VNST Token ABI */];
const vnstStakingABI = [/* Your VNST Staking ABI */];
const usdtTokenABI = [/* USDT Token ABI */];

const vnstTokenAddress = "0x..."; // Replace with your VNST token address
const vnstStakingAddress = "0x..."; // Replace with your staking contract address
const usdtTokenAddress = "0x..."; // Replace with USDT token address

// Global variables
let web3;
let accounts = [];
let vnstTokenContract;
let vnstStakingContract;
let usdtTokenContract;
let currentNetworkId;

// DOM Elements
const walletConnectBtn = document.getElementById('walletConnectBtn');
const walletAddress = document.getElementById('walletAddress');
const vnstBalance = document.getElementById('vnstBalance');
const stakeAmount = document.getElementById('stakeAmount');
const referralAddress = document.getElementById('referralAddress');
const approveMaxBtn = document.getElementById('approveMaxBtn');
const stakeBtn = document.getElementById('stakeBtn');
const activeStake = document.getElementById('activeStake');
const directMembers = document.getElementById('directMembers');
const totalEarned = document.getElementById('totalEarned');
const pendingVNT = document.getElementById('pendingVNT');
const pendingUSDT = document.getElementById('pendingUSDT');
const claimTokenBtn = document.getElementById('claimTokenBtn');
const claimUsdtBtn = document.getElementById('claimUsdtBtn');
const referralLink = document.getElementById('referralLink');
const copyReferralBtn = document.getElementById('copyReferralBtn');
const minStake = document.getElementById('minStake');
const maxStake = document.getElementById('maxStake');

// Initialize Web3
async function initWeb3() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            currentNetworkId = await web3.eth.net.getId();
            
            // Initialize contracts
            vnstTokenContract = new web3.eth.Contract(vnstTokenABI, vnstTokenAddress);
            vnstStakingContract = new web3.eth.Contract(vnstStakingABI, vnstStakingAddress);
            usdtTokenContract = new web3.eth.Contract(usdtTokenABI, usdtTokenAddress);
            
            // Update UI
            updateWalletUI();
            loadStakingData();
            
            // Set up event listeners
            window.ethereum.on('accountsChanged', (newAccounts) => {
                accounts = newAccounts;
                updateWalletUI();
                loadStakingData();
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
            
        } catch (error) {
            console.error("User denied account access", error);
            showMessage("Please connect your wallet to continue", "error");
        }
    } else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
        showMessage("Please update your MetaMask to the latest version", "error");
    } else {
        showMessage("Non-Ethereum browser detected. Please install MetaMask", "error");
    }
}

// Update wallet UI
function updateWalletUI() {
    if (accounts.length > 0) {
        const shortAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
        walletConnectBtn.textContent = shortAddress;
        walletConnectBtn.classList.add('connected');
        
        if (walletAddress) {
            walletAddress.textContent = shortAddress;
        }
        
        // Update referral link
        if (referralLink) {
            referralLink.textContent = `${window.location.origin}/staking.html?ref=${accounts[0]}`;
        }
    } else {
        walletConnectBtn.textContent = "Connect Wallet";
        walletConnectBtn.classList.remove('connected');
        
        if (walletAddress) {
            walletAddress.textContent = "Not connected";
        }
        
        if (referralLink) {
            referralLink.textContent = "Connect wallet to get your referral link";
        }
    }
}

// Load staking data
async function loadStakingData() {
    if (!accounts.length) return;
    
    try {
        // Get VNST balance
        const balance = await vnstTokenContract.methods.balanceOf(accounts[0]).call();
        if (vnstBalance) vnstBalance.textContent = web3.utils.fromWei(balance, 'ether');
        
        // Get staking info
        const stakeInfo = await vnstStakingContract.methods.stakes(accounts[0]).call();
        if (activeStake) activeStake.textContent = web3.utils.fromWei(stakeInfo.amount, 'ether');
        
        // Get user stats
        const userStats = await vnstStakingContract.methods.getUserStats(accounts[0]).call();
        if (directMembers) directMembers.textContent = userStats.totalDirectMembers;
        if (totalEarned) totalEarned.textContent = web3.utils.fromWei(userStats.totalEarned, 'ether');
        
        // Get pending rewards
        const rewards = await vnstStakingContract.methods.getPendingRewards(accounts[0]).call();
        if (pendingVNT) pendingVNT.textContent = web3.utils.fromWei(rewards.vntReward, 'ether');
        if (pendingUSDT) pendingUSDT.textContent = web3.utils.fromWei(rewards.usdtReward, 'ether');
        
        // Get staking limits
        const minAmount = await vnstStakingContract.methods.minStakeAmount().call();
        const maxAmount = await vnstStakingContract.methods.maxStakeAmount().call();
        if (minStake) minStake.textContent = web3.utils.fromWei(minAmount, 'ether');
        if (maxStake) maxStake.textContent = web3.utils.fromWei(maxAmount, 'ether');
        
        // Load team data if on team page
        if (window.location.pathname.includes('team.html')) {
            loadTeamData();
        }
        
        // Load home stats if on home page
        if (window.location.pathname.includes('index.html')) {
            loadHomeStats();
        }
        
    } catch (error) {
        console.error("Error loading staking data:", error);
        showMessage("Error loading staking data", "error");
    }
}

// Load team data
async function loadTeamData() {
    try {
        // Get direct members
        const directCount = await vnstStakingContract.methods.getReferralCount(accounts[0]).call();
        document.getElementById('directCount').textContent = directCount;
        
        // Get level data
        for (let i = 1; i <= 5; i++) {
            const levelCount = await vnstStakingContract.methods.getLevelReferralCount(accounts[0], i-1).call();
            document.getElementById(`level${i}Count`).textContent = levelCount;
            
            // Check if level is unlocked
            const requiredMembers = await vnstStakingContract.methods.requiredDirectMembers(i-1).call();
            if (directCount >= requiredMembers) {
                document.getElementById(`level${i}Status`).textContent = "Active";
                document.getElementById(`level${i}Status`).className = "status-active";
            } else {
                document.getElementById(`level${i}Status`).textContent = "Locked";
                document.getElementById(`level${i}Status`).className = "status-locked";
            }
        }
        
    } catch (error) {
        console.error("Error loading team data:", error);
        showMessage("Error loading team data", "error");
    }
}

// Load home page stats
async function loadHomeStats() {
    try {
        // Get total staked
        const totalStaked = await vnstStakingContract.methods.getWalletBalances().call();
        document.getElementById('totalStaked').textContent = `${web3.utils.fromWei(totalStaked.vnstStakingBalance, 'ether')} VNST`;
        
        // Get user staked
        const userStake = await vnstStakingContract.methods.stakes(accounts[0]).call();
        document.getElementById('userStaked').textContent = `${web3.utils.fromWei(userStake.amount, 'ether')} VNST`;
        
        // Note: These would need to be tracked by your contract or backend
        document.getElementById('totalWithdrawn').textContent = "0 VNST"; // Placeholder
        document.getElementById('activeStakers').textContent = "0"; // Placeholder
        document.getElementById('vntRewards').textContent = `${web3.utils.fromWei(pendingVNT.textContent, 'ether')} VNT`;
        document.getElementById('usdtRewards').textContent = `${web3.utils.fromWei(pendingUSDT.textContent, 'ether')} USDT`;
        
    } catch (error) {
        console.error("Error loading home stats:", error);
        showMessage("Error loading home stats", "error");
    }
}

// Approve max VNST for staking
async function approveMax() {
    if (!accounts.length) {
        showMessage("Please connect your wallet first", "error");
        return;
    }
    
    try {
        approveMaxBtn.disabled = true;
        approveMaxBtn.innerHTML = '<span class="loading-spinner"></span> Approving...';
        
        const maxAmount = await vnstStakingContract.methods.maxStakeAmount().call();
        
        const tx = await vnstTokenContract.methods.approve(vnstStakingAddress, maxAmount)
            .send({ from: accounts[0] });
            
        showMessage("Approval successful!", "success");
        stakeAmount.value = web3.utils.fromWei(maxAmount, 'ether');
        
    } catch (error) {
        console.error("Approval error:", error);
        showMessage("Approval failed", "error");
    } finally {
        approveMaxBtn.disabled = false;
        approveMaxBtn.textContent = "Approve Max";
    }
}

// Stake VNST
async function stakeVNST() {
    if (!accounts.length) {
        showMessage("Please connect your wallet first", "error");
        return;
    }
    
    const amount = stakeAmount.value;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        showMessage("Please enter a valid amount", "error");
        return;
    }
    
    const minAmount = await vnstStakingContract.methods.minStakeAmount().call();
    const maxAmount = await vnstStakingContract.methods.maxStakeAmount().call();
    
    if (web3.utils.toWei(amount, 'ether') < minAmount) {
        showMessage(`Amount must be at least ${web3.utils.fromWei(minAmount, 'ether')} VNST`, "error");
        return;
    }
    
    if (web3.utils.toWei(amount, 'ether') > maxAmount) {
        showMessage(`Amount must not exceed ${web3.utils.fromWei(maxAmount, 'ether')} VNST`, "error");
        return;
    }
    
    try {
        stakeBtn.disabled = true;
        stakeBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
        
        const allowance = await vnstTokenContract.methods.allowance(accounts[0], vnstStakingAddress).call();
        if (web3.utils.toWei(amount, 'ether') > allowance) {
            showMessage("Please approve the contract to spend your VNST first", "error");
            return;
        }
        
        const referrer = referralAddress.value || "0x0000000000000000000000000000000000000000";
        
        const tx = await vnstStakingContract.methods.stake(
            web3.utils.toWei(amount, 'ether'),
            referrer
        ).send({ from: accounts[0] });
        
        showMessage("Staking successful!", "success");
        loadStakingData();
        
    } catch (error) {
        console.error("Staking error:", error);
        showMessage("Staking failed", "error");
    } finally {
        stakeBtn.disabled = false;
        stakeBtn.textContent = "Stake VNST";
    }
}

// Claim VNT rewards
async function claimVNT() {
    if (!accounts.length) {
        showMessage("Please connect your wallet first", "error");
        return;
    }
    
    try {
        claimTokenBtn.disabled = true;
        claimTokenBtn.innerHTML = '<span class="loading-spinner"></span> Claiming...';
        
        const tx = await vnstStakingContract.methods.claimRewards()
            .send({ from: accounts[0] });
            
        showMessage("VNT claimed successfully!", "success");
        loadStakingData();
        
    } catch (error) {
        console.error("Claim error:", error);
        showMessage("Claim failed", "error");
    } finally {
        claimTokenBtn.disabled = false;
        claimTokenBtn.textContent = "Claim VNT";
    }
}

// Claim USDT rewards
async function claimUSDT() {
    if (!accounts.length) {
        showMessage("Please connect your wallet first", "error");
        return;
    }
    
    try {
        claimUsdtBtn.disabled = true;
        claimUsdtBtn.innerHTML = '<span class="loading-spinner"></span> Claiming...';
        
        const tx = await vnstStakingContract.methods.claimRewards()
            .send({ from: accounts[0] });
            
        showMessage("USDT claimed successfully!", "success");
        loadStakingData();
        
    } catch (error) {
        console.error("Claim error:", error);
        showMessage("Claim failed", "error");
    } finally {
        claimUsdtBtn.disabled = false;
        claimUsdtBtn.textContent = "Claim USDT";
    }
}

// Copy referral link
function copyReferralLink() {
    if (!accounts.length) {
        showMessage("Please connect your wallet first", "error");
        return;
    }
    
    const link = referralLink.textContent;
    navigator.clipboard.writeText(link)
        .then(() => showMessage("Referral link copied!", "success"))
        .catch(() => showMessage("Failed to copy link", "error"));
}

// Show message
function showMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `${type}-message`;
    messageElement.textContent = message;
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.remove();
    }, 5000);
}

// Toggle mobile menu
function toggleMenu() {
    const menu = document.querySelector('nav ul');
    menu.classList.toggle('show');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Web3
    walletConnectBtn.addEventListener('click', initWeb3);
    
    // Menu toggle for mobile
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    
    // Check for referral in URL
    if (window.location.pathname.includes('staking.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        if (ref) {
            referralAddress.value = ref;
        }
    }
    
    // Staking page events
    if (approveMaxBtn) approveMaxBtn.addEventListener('click', approveMax);
    if (stakeBtn) stakeBtn.addEventListener('click', stakeVNST);
    if (claimTokenBtn) claimTokenBtn.addEventListener('click', claimVNT);
    if (claimUsdtBtn) claimUsdtBtn.addEventListener('click', claimUSDT);
    if (copyReferralBtn) copyReferralBtn.addEventListener('click', copyReferralLink);
});
