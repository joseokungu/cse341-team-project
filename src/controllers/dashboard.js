export function dashboardPage(req, res) {
    return res.render('dashboard', {
        title: 'My Dashboard'
    });
}