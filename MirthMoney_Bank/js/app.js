let balance = 0;
let miningBalance = 0;
let username = '';
let lastTransferTime = 0;
let tempEmail = '';
let isMining = false;

// Подсчет пользователей
let onlineUsers = JSON.parse(localStorage.getItem('onlineUsers')) || 0;
updateOnlineUsers();

function updateBalance() {
    document.getElementById('balance').innerText = balance;
    saveBalance(); // Сохраняем баланс в localStorage
}

function saveBalance() {
    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    const currentUser = usersData.find(user => user.username === username);
    
    if (currentUser) {
        currentUser.balance = balance; // Обновляем баланс текущего пользователя
        localStorage.setItem('mirthmoney_users', JSON.stringify(usersData)); // Сохраняем данные пользователей
    }
}

function updateMiningBalance() {
    document.getElementById('miningBalance').innerText = miningBalance;
}

function updateUsername() {
    document.getElementById('username').innerText = username;
}

function updateOnlineUsers() {
    onlineUsers++;
    localStorage.setItem('onlineUsers', onlineUsers);
    document.getElementById('userCount').innerText = onlineUsers;

    // Устанавливаем таймер для уменьшения количества пользователей через 5 минут
    setTimeout(() => {
        onlineUsers--;
        localStorage.setItem('onlineUsers', Math.max(0, onlineUsers));
        document.getElementById('userCount').innerText = onlineUsers;
    }, 300000); // 300000 мс = 5 минут
}

function calculateTotalBalance() {
    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    const totalBalance = usersData.reduce((sum, user) => sum + user.balance, 0);
    document.getElementById('totalBalance').innerText = totalBalance;
}

function generateRandomUsername(existingUsernames) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result;
    do {
        result = '';
        for (let i = 0; i < 43; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (existingUsernames.includes(result));
    return result;
}

function transferFunds() {
    const recipient = document.getElementById('recipient').value.trim();
    const amount = parseInt(document.getElementById('transferAmount').value);
    const commission = Math.floor(amount * 0.05); // 5% комиссия

    if (!recipient || recipient === username) {
        alert("Некорректное имя получателя!");
        return;
    }

    if (amount <= 0 || balance < amount + commission) {
        alert("Недостаточно средств или неверная сумма!");
        return;
    }

    const currentTime = Date.now();
    if (currentTime - lastTransferTime < 30000) {
        alert("Подождите 30 секунд перед следующим переводом.");
        return;
    }

    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    const recipientData = usersData.find(user => user.username === recipient);

    if (!recipientData) {
        alert("Получатель не найден.");
        return;
    }

    if (confirm(`Вы уверены, что хотите отправить ${amount} MM пользователю ${recipient}?`)) {
        // Обновление баланса отправителя
        balance -= (amount + commission);
        recipientData.balance += amount; // Обновление баланса получателя

        // Распределение комиссии среди пользователей, участвующих в майнинге
        if (isMining) {
            const miningUsers = usersData.filter(user => user.isMining);
            const commissionPerUser = commission / miningUsers.length;
            miningUsers.forEach(user => {
                user.balance += commissionPerUser; // Добавляем комиссию к каждому пользователю, который майнит
            });
        }

        // Сохранение обновленных данных пользователей
        localStorage.setItem('mirthmoney_users', JSON.stringify(usersData));
        
        // Обновление интерфейса
        updateBalance();
        addHistory(`Переведено: ${amount} MM пользователю ${recipient}`);

        lastTransferTime = currentTime;
    }
}

function addHistory(transaction) {
    const historyList = document.getElementById('history');
    const newTransaction = document.createElement('li');
    newTransaction.innerText = transaction;
    historyList.appendChild(newTransaction);
    
    // Сохраняем историю транзакций в localStorage
    const transactionHistory = JSON.parse(localStorage.getItem('transactionHistory')) || [];
    transactionHistory.push({
        username: username,
        transaction: transaction,
        date: new Date().toLocaleString()
    });
    localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
}

function displayTransactionHistory() {
    const historyList = document.getElementById('history');
    historyList.innerHTML = ''; // Очищаем текущий список
    const transactionHistory = JSON.parse(localStorage.getItem('transactionHistory')) || [];
    
    transactionHistory.forEach(item => {
        const newTransaction = document.createElement('li');
        newTransaction.innerText = `${item.date}: ${item.username} - ${item.transaction}`;
        historyList.appendChild(newTransaction);
    });
}

function startRegistration() {
    const email = document.getElementById('email').value.trim();
    if (!email) {
        alert('Пожалуйста, введите корректный email.');
        return;
    }

    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    
    if (usersData.find(user => user.email === email)) {
        alert('Данный адрес электронной почты уже зарегистрирован. Войдите в аккаунт.');
        return;
    }

    tempEmail = email;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('password-section').style.display = 'block';
}

function completeRegistration() {
    const password = document.getElementById('password').value;
    if (password.length < 4) {
        alert('Пароль должен содержать минимум 4 символа.');
        return;
    }

    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    const existingUsernames = usersData.map(user => user.username);
    const initialBalance = Math.floor(Math.random() * 1000) + 500;
    username = generateRandomUsername(existingUsernames);

    const user = {
        email: tempEmail,
        password: password,
        balance: initialBalance,
        username: username,
        isMining: false // Добавляем поле для майнинга
    };

    usersData.push(user);
    localStorage.setItem('mirthmoney_users', JSON.stringify(usersData));
    alert(`Регистрация успешна! Ваше имя пользователя: ${username}`);

    // Перенаправление на главную страницу
    balance = initialBalance; // Установка баланса
    updateBalance(); // Обновление отображаемого баланса
    updateUsername(); // Обновление отображаемого имени пользователя
    calculateTotalBalance(); // Обновление общего баланса

    document.getElementById('password-section').style.display = 'none';
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('account').style.display = 'block';
    document.getElementById('transaction-history').style.display = 'block';

    startAutoUpdate(); // Начало автоматического обновления баланса
}

function showLogin() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
        alert('Пожалуйста, введите email и пароль.');
        return;
    }

    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    const userData = usersData.find(user => user.email === email);

    if (!userData) {
        alert('Данный адрес электронной почты не зарегистрирован. Зарегистрируйтесь.');
        return;
    }

    if (userData.password === password) {
        balance = userData.balance;
        username = userData.username;

        // Сохраняем статус майнинга
        isMining = userData.isMining;

        document.getElementById('login-section').style.display = 'none';
        document.getElementById('account').style.display = 'block';
        document.getElementById('transaction-history').style.display = 'block';
        updateBalance();
        updateUsername();
        calculateTotalBalance(); // Обновление общего баланса

        displayTransactionHistory(); // Отображение истории транзакций
        startAutoUpdate(); // Начало автоматического обновления баланса
    } else {
        alert('Неверный пароль.');
    }
}

function startMining() {
    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    const userData = usersData.find(user => user.username === username);

    if (userData) {
        userData.isMining = true; // Устанавливаем статус майнинга в true
        localStorage.setItem('mirthmoney_users', JSON.stringify(usersData));
        isMining = true; // Обновляем локальный статус
        miningBalance = 0; // Сбрасываем баланс майнинга
        document.getElementById('account').style.display = 'none';
        document.getElementById('mining-section').style.display = 'block';
        updateMiningBalance();
        startMiningInterval(); // Начинаем периодическое начисление
    }
}

function startMiningInterval() {
    const miningInterval = setInterval(() => {
        if (isMining) {
            miningBalance += 1.5734; // Добавляем 1.5734 MM за период
            updateMiningBalance();
        } else {
            clearInterval(miningInterval); // Останавливаем интервал, если пользователь вышел
        }
    }, 2500); // Каждые 2.5 секунд
}

function stopMining() {
    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    const userData = usersData.find(user => user.username === username);

    if (userData) {
        userData.isMining = false; // Устанавливаем статус майнинга в false
        localStorage.setItem('mirthmoney_users', JSON.stringify(usersData));
        isMining = false; // Обновляем локальный статус
        balance += miningBalance; // Добавляем баланс майнинга в основной баланс
        miningBalance = 0; // Сбрасываем баланс майнинга
        updateBalance();
        document.getElementById('mining-section').style.display = 'none';
        document.getElementById('account').style.display = 'block';
    }
}

function startAutoUpdate() {
    setInterval(autoUpdateBalance, 6000); // Каждые 6 секунд обновляем баланс
}

function autoUpdateBalance() {
    const usersData = JSON.parse(localStorage.getItem('mirthmoney_users')) || [];
    
    // Обновляем баланс для текущего пользователя
    const currentUser = usersData.find(user => user.username === username);
    if (currentUser) {
        balance = currentUser.balance; // Обновляем локальный баланс
        updateBalance(); // Обновляем отображение баланса
    }
}

function logout() {
    // Уменьшаем количество пользователей онлайн
    onlineUsers = Math.max(0, onlineUsers - 1);
    localStorage.setItem('onlineUsers', onlineUsers);
    document.getElementById('userCount').innerText = onlineUsers;

    // Сбросим данные пользователя
    balance = 0;
    miningBalance = 0;
    username = '';
    tempEmail = '';
    isMining = false;

    // Показать секции аутентификации
    document.getElementById('account').style.display = 'none';
    document.getElementById('transaction-history').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('login-section').style.display = 'none';
}

// Обработчик события, чтобы уменьшить количество онлайн-пользователей при закрытии страницы
window.addEventListener('beforeunload', () => {
    onlineUsers = Math.max(0, onlineUsers - 1);
    localStorage.setItem('onlineUsers', onlineUsers);
    document.getElementById('userCount').innerText = onlineUsers;
});

// Показать статус онлайн при загрузке страницы
window.onload = function() {
    updateOnlineUsers(); // Увеличиваем количество пользователей при загрузке
    document.getElementById('status').style.display = 'block'; // Показать статус при загрузке
};

// Опционально: убрать статус через 5 секунд
setTimeout(function() {
    document.getElementById('status').style.display = 'none';
}, 5000);