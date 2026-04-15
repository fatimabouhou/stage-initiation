$(document).ready(function() {
    let deleteId;
    
    $('.delete-btn').click(function() {
        deleteId = $(this).data('id');
        $('#deleteModal').modal('show');
    });
    
    $('#confirmDelete').click(function() {
        $.ajax({
            url: "{% url 'delete_parebrise' 0 %}".replace('0', deleteId),
            method: 'POST',
            data: {
                'csrfmiddlewaretoken': '{{ csrf_token }}'
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
                }
            }
        });
    });
});